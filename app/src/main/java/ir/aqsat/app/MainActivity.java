package ir.aqsat.app;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * پوستهٔ اندروید برای MyC.
 * - صفحهٔ وب را آفلاین اجرا می‌کند
 * - پشتیبان را در پوشهٔ Download ذخیره می‌کند
 * - انتخاب فایل برای بازیابی را فعال می‌کند
 * - اعلان‌های سررسید را با AlarmManager زمان‌بندی می‌کند
 */
public class MainActivity extends Activity {

    private static final int REQ_PICK_FILE = 1001;
    private static final int REQ_NOTIF = 1002;
    private static final int ALARM_BASE = 4100;
    private static final int ALARM_MAX = 60;

    private WebView web;
    private ValueCallback<Uri[]> pendingFileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        web.setWebViewClient(new WebViewClient());

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view,
                                             ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (pendingFileCallback != null) {
                    pendingFileCallback.onReceiveValue(null);
                }
                pendingFileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent, REQ_PICK_FILE);
                    return true;
                } catch (Exception e) {
                    pendingFileCallback = null;
                    return false;
                }
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result) {
                new android.app.AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("باشه", (d, w) -> result.confirm())
                        .setOnCancelListener(d -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final android.webkit.JsResult result) {
                new android.app.AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("بله", (d, w) -> result.confirm())
                        .setNegativeButton("نه", (d, w) -> result.cancel())
                        .setOnCancelListener(d -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue,
                                      final android.webkit.JsPromptResult result) {
                final android.widget.EditText input = new android.widget.EditText(MainActivity.this);
                input.setText(defaultValue == null ? "" : defaultValue);
                new android.app.AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setView(input)
                        .setPositiveButton("تایید", (d, w) -> result.confirm(input.getText().toString()))
                        .setNegativeButton("انصراف", (d, w) -> result.cancel())
                        .setOnCancelListener(d -> result.cancel())
                        .show();
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidAqsat");

        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");

        askNotificationPermission();
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIF);
            }
        }
    }

    /** پل جاوااسکریپت ← اندروید */
    public class Bridge {

        @JavascriptInterface
        public boolean saveFile(String fileName, String content) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false;

            OutputStream out = null;
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return false;

                out = getContentResolver().openOutputStream(uri);
                if (out == null) return false;

                out.write(content.getBytes(StandardCharsets.UTF_8));
                out.flush();
                return true;
            } catch (Exception e) {
                return false;
            } finally {
                if (out != null) {
                    try { out.close(); } catch (Exception ignored) { }
                }
            }
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> MainActivity.this.finish());
        }

        @JavascriptInterface
        public void schedule(String json) {
            try {
                JSONObject root = new JSONObject(json);
                boolean sound = root.optBoolean("sound", true);
                JSONArray items = root.optJSONArray("items");

                AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
                if (am == null) return;

                // پاک‌کردن زمان‌بندی‌های قبلی
                for (int i = 0; i < ALARM_MAX; i++) {
                    PendingIntent old = pendingFor(i, sound, "", "");
                    if (old != null) {
                        am.cancel(old);
                        old.cancel();
                    }
                }

                if (items == null) return;
                int count = Math.min(items.length(), ALARM_MAX);
                for (int i = 0; i < count; i++) {
                    JSONObject it = items.getJSONObject(i);
                    long at = it.optLong("at", 0);
                    if (at <= System.currentTimeMillis()) continue;

                    String title = it.optString("title", "MyC");
                    String body = it.optString("body", "");
                    boolean itemSound = it.optBoolean("sound", sound);

                    PendingIntent pi = pendingFor(i, itemSound, title, body);
                    if (pi == null) continue;

                    if (Build.VERSION.SDK_INT >= 23) {
                        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                    } else {
                        am.set(AlarmManager.RTC_WAKEUP, at, pi);
                    }
                }
            } catch (Exception ignored) {
                // زمان‌بندی ناموفق — اپ بدون اعلان کار می‌کند
            }
        }

        private PendingIntent pendingFor(int index, boolean sound, String title, String body) {
            Intent intent = new Intent(MainActivity.this, AlarmReceiver.class);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("sound", sound);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
            return PendingIntent.getBroadcast(MainActivity.this, ALARM_BASE + index, intent, flags);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_PICK_FILE) {
            if (pendingFileCallback != null) {
                pendingFileCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingFileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        // تصمیم‌گیری در خود صفحه: برگشت، بستن پنجره، یا پرسش خروج
        if (web != null) {
            web.evaluateJavascript("window.onAndroidBack && window.onAndroidBack()", null);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
