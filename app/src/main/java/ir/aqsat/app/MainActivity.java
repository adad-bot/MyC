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
    private static final int REQ_QR = 1003;
    private static final int REQ_PHOTO = 1004;
    private Uri photoUri = null;
    private Uri qrUri = null;
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

        // اجازهٔ اعلان در اندروید ۱۳ و بالاتر
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                if (checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                        != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7801);
                }
            } catch (Exception ignored) { }
        }

        askNotificationPermission();
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIF);
            }
        }
    }

    /** اجرای کد JS از رشتهٔ بومی */
    private void runJs(String code) {
        runOnUiThread(() -> {
            try {
                if (web != null) web.evaluateJavascript(code, null);
            } catch (Exception ignored) { }
        });
    }

    private void failBiometric() {
        runJs("window.onBiometricFail && window.onBiometricFail()");
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

        /** گرفتن عکس از چک با دوربین سیستم و برگرداندن Base64 به جاوااسکریپت */
        @JavascriptInterface
        public void capturePhoto() {
            runOnUiThread(() -> {
                try {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, "myc_chq_" + System.currentTimeMillis() + ".jpg");
                    v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                    photoUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);

                    Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    if (photoUri != null) {
                        i.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
                        i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    }
                    startActivityForResult(i, REQ_PHOTO);
                } catch (Throwable ignored) { }
            });
        }

        /** گرفتن عکس با دوربین سیستم و خواندن QR از عکس (مطمئن‌ترین راه) */
        @JavascriptInterface
        public void captureQr() {
            runOnUiThread(() -> {
                try {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, "myc_qr_" + System.currentTimeMillis() + ".jpg");
                    v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                    qrUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);

                    Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    if (qrUri != null) {
                        i.putExtra(MediaStore.EXTRA_OUTPUT, qrUri);
                        i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    }
                    startActivityForResult(i, REQ_QR);
                } catch (Throwable ignored) { }
            });
        }

        /** باز کردن اسکنر زندهٔ QR */
        @JavascriptInterface
        public void scanQr() {
            runOnUiThread(() -> {
                try {
                    startActivityForResult(new Intent(MainActivity.this, QrScanActivity.class), REQ_QR);
                } catch (Throwable t) {
                    // اگر اسکنر زنده بالا نیامد، دوربین عکاسی
                    try {
                        ContentValues v = new ContentValues();
                        v.put(MediaStore.Images.Media.DISPLAY_NAME, "myc_qr_" + System.currentTimeMillis() + ".jpg");
                        v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                        qrUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);

                        Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        if (qrUri != null) {
                            i.putExtra(MediaStore.EXTRA_OUTPUT, qrUri);
                            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        }
                        startActivityForResult(i, REQ_QR);
                    } catch (Throwable ignored) { }
                }
            });
        }

        /** رنگ‌آمیزی نوار پایین و بالا (دکمه‌های سیستم) هماهنگ با اپ */
        @JavascriptInterface
        public void setBars(final String color, final boolean lightIcons) {
            runOnUiThread(() -> {
                try {
                    int c = android.graphics.Color.parseColor(color);

                    getWindow().setNavigationBarColor(c);
                    getWindow().setStatusBarColor(c);

                    android.view.View decor = getWindow().getDecorView();
                    int flags = decor.getSystemUiVisibility();

                    if (lightIcons) {
                        flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    } else {
                        flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    }

                    decor.setSystemUiVisibility(flags);
                } catch (Throwable ignored) { }
            });
        }

        /** ذخیرهٔ تصویر (Base64) در Download */
        @JavascriptInterface
        public boolean saveImage(String base64, String fileName) {
            OutputStream out = null;
            try {
                byte[] bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);

                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MyC");
                }

                Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return false;

                out = getContentResolver().openOutputStream(uri);
                if (out == null) return false;

                out.write(bytes);
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

        /** ذخیرهٔ فایل پشتیبان در Documents/Back_Miaad (و در صورت خطا در Download/Back_Miaad) */
        @JavascriptInterface
        public boolean saveDocs(String fileName, String content) {
            if (writeTo(MediaStore.Files.getContentUri("external"),
                    Environment.DIRECTORY_DOCUMENTS + "/Back_Miaad", fileName, content)) return true;

            if (writeTo(MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    Environment.DIRECTORY_DOWNLOADS + "/Back_Miaad", fileName, content)) return true;

            return writeTo(MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    Environment.DIRECTORY_DOWNLOADS, fileName, content);
        }

        private boolean writeTo(Uri collection, String relativePath, String fileName, String content) {
            OutputStream out = null;
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && relativePath != null) {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
                }

                Uri uri = getContentResolver().insert(collection, values);
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

        /** خواندن QR از تصویر (Base64) و برگرداندن متن */
        @JavascriptInterface
        public String decodeQrBase64(String b64) {
            try {
                byte[] bytes = android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
                android.graphics.Bitmap bmp =
                        android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bmp == null) return "";

                int w = bmp.getWidth();
                int h = bmp.getHeight();
                int[] px = new int[w * h];
                bmp.getPixels(px, 0, w, 0, 0, w, h);

                com.google.zxing.LuminanceSource src =
                        new com.google.zxing.RGBLuminanceSource(w, h, px);
                com.google.zxing.BinaryBitmap bb =
                        new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(src));

                com.google.zxing.Result r = new com.google.zxing.MultiFormatReader().decode(bb);
                return r != null ? r.getText() : "";
            } catch (Exception e) {
                return "";
            }
        }

        /** آیا گوشی اثر انگشت/چهره دارد و قفل صفحه فعال است؟ */
        @JavascriptInterface
        public boolean hasBiometric() {
            if (Build.VERSION.SDK_INT < 28) return false;
            try {
                PackageManager pm = getPackageManager();
                boolean hw = pm.hasSystemFeature("android.hardware.fingerprint")
                        || pm.hasSystemFeature("android.hardware.face")
                        || pm.hasSystemFeature("android.hardware.iris");
                if (!hw) return false;

                android.app.KeyguardManager km =
                        (android.app.KeyguardManager) getSystemService(KEYGUARD_SERVICE);
                return km != null && km.isDeviceSecure();
            } catch (Exception e) {
                return false;
            }
        }

        /** نمایش پنجرهٔ اثر انگشت؛ در صورت موفقیت onBiometricOk در JS صدا زده می‌شود */
        @JavascriptInterface
        public void askBiometric() {
            if (Build.VERSION.SDK_INT < 28) { failBiometric(); return; }

            runOnUiThread(() -> {
                try {
                    java.util.concurrent.Executor ex = getMainExecutor();

                    android.hardware.biometrics.BiometricPrompt prompt =
                            new android.hardware.biometrics.BiometricPrompt.Builder(MainActivity.this)
                                    .setTitle("ورود به MyC")
                                    .setSubtitle("انگشت را روی حسگر بگذار")
                                    .setNegativeButton("انصراف", ex, (d, w) -> { })
                                    .build();

                    prompt.authenticate(new android.os.CancellationSignal(), ex,
                            new android.hardware.biometrics.BiometricPrompt.AuthenticationCallback() {
                                @Override
                                public void onAuthenticationSucceeded(
                                        android.hardware.biometrics.BiometricPrompt.AuthenticationResult result) {
                                    runJs("window.onBiometricOk && window.onBiometricOk()");
                                }

                                @Override
                                public void onAuthenticationFailed() {
                                    runJs("window.onBiometricFail && window.onBiometricFail()");
                                }
                            });
                } catch (Exception e) {
                    failBiometric();
                }
            });
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

        if (requestCode == REQ_PHOTO) {
            String b64 = "";
            if (resultCode == RESULT_OK && photoUri != null) {
                try {
                    java.io.InputStream in = getContentResolver().openInputStream(photoUri);
                    android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(in);
                    if (in != null) in.close();

                    if (bmp != null) {
                        int w = bmp.getWidth(), h = bmp.getHeight();
                        int max = 1100;
                        if (Math.max(w, h) > max) {
                            float k = max / (float) Math.max(w, h);
                            bmp = android.graphics.Bitmap.createScaledBitmap(
                                    bmp, Math.round(w * k), Math.round(h * k), true);
                        }
                        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
                        bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, bos);
                        b64 = android.util.Base64.encodeToString(bos.toByteArray(), android.util.Base64.NO_WRAP);
                    }
                } catch (Throwable ignored) { }
            }

            if (photoUri != null) {
                try { getContentResolver().delete(photoUri, null, null); } catch (Exception ignored) { }
                photoUri = null;
            }

            try {
                runJs("window.onPhotoResult && window.onPhotoResult(" + JSONObject.quote(b64) + ")");
            } catch (Exception ignored) { }
            return;
        }

        if (requestCode == REQ_QR) {
            String text = "";

            if (data != null) {
                String direct = data.getStringExtra("text");
                if (direct != null) {
                    text = direct;
                    try {
                        String js = "window.onQrResult && window.onQrResult(" + JSONObject.quote(text) + ")";
                        runJs(js);
                    } catch (Exception ignored) { }
                    return;
                }
            }

            if (resultCode == RESULT_OK) {
                Uri uri = qrUri;
                if (uri == null && data != null && data.getData() != null) uri = data.getData();

                if (uri != null) {
                    text = decodeQrUri(uri);
                } else if (data != null && data.getParcelableExtra("data") != null) {
                    try {
                        android.graphics.Bitmap bmp =
                                (android.graphics.Bitmap) data.getParcelableExtra("data");
                        com.google.zxing.Result r = decodeBitmap(bmp);
                        text = r != null ? r.getText() : "ERR:NOTFOUND:thumb";
                    } catch (Exception e) {
                        text = "ERR:NOTFOUND:thumb";
                    }
                } else {
                    text = "ERR:NOIMAGE";
                }
            } else {
                text = "ERR:CANCELLED";
            }

            if (qrUri != null) {
                try { getContentResolver().delete(qrUri, null, null); } catch (Exception ignored) { }
                qrUri = null;
            }
            try {
                String js = "window.onQrResult && window.onQrResult(" + JSONObject.quote(text) + ")";
                runJs(js);
            } catch (Exception ignored) { }
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    private String decodeQrUri(Uri uri) {
        String lastErr = "unknown";
        try {
            for (int sample : new int[]{1, 2, 4}) {
                android.graphics.Bitmap bmp = loadScaled(uri, sample);
                if (bmp == null) continue;

                android.graphics.Bitmap oriented = orientBitmap(bmp);

                for (int rot = 0; rot < 360; rot += 90) {
                    android.graphics.Bitmap cand = oriented;
                    try {
                        if (rot != 0) {
                            android.graphics.Matrix mtx = new android.graphics.Matrix();
                            mtx.postRotate(rot);
                            cand = android.graphics.Bitmap.createBitmap(
                                    oriented, 0, 0, oriented.getWidth(), oriented.getHeight(), mtx, true);
                        }
                        com.google.zxing.Result r = decodeBitmap(cand);
                        if (r != null && r.getText() != null && r.getText().length() > 0) {
                            return r.getText();
                        }
                    } catch (Throwable e) {
                        lastErr = e.getClass().getSimpleName();
                    } finally {
                        if (cand != null && cand != oriented) {
                            try { cand.recycle(); } catch (Exception ignored) { }
                        }
                    }
                }
                try { oriented.recycle(); } catch (Exception ignored) { }
            }
            return "ERR:NOTFOUND:" + lastErr;
        } catch (Exception e) {
            return "ERR:" + e.getClass().getSimpleName();
        }
    }

    /** چرخش تصویر بر اساس EXIF (دوربین معمولاً ۹۰ درجه می‌چرخاند) */
    private android.graphics.Bitmap orientBitmap(android.graphics.Bitmap bmp) {
        try {
            java.io.InputStream in = getContentResolver().openInputStream(qrUri);
            android.media.ExifInterface exif = new android.media.ExifInterface(in);
            int o = exif.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,
                    android.media.ExifInterface.ORIENTATION_NORMAL);
            in.close();

            int deg = 0;
            if (o == android.media.ExifInterface.ORIENTATION_ROTATE_90) deg = 90;
            else if (o == android.media.ExifInterface.ORIENTATION_ROTATE_180) deg = 180;
            else if (o == android.media.ExifInterface.ORIENTATION_ROTATE_270) deg = 270;
            if (deg == 0) return bmp;

            android.graphics.Matrix mtx = new android.graphics.Matrix();
            mtx.postRotate(deg);
            android.graphics.Bitmap out = android.graphics.Bitmap.createBitmap(
                    bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), mtx, true);
            try { bmp.recycle(); } catch (Exception ignored) { }
            return out;
        } catch (Throwable t) {
            return bmp;
        }
    }

    private android.graphics.Bitmap loadScaled(Uri uri, int sample) {
        try {
            android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
            o.inSampleSize = Math.max(1, sample);
            java.io.InputStream in = getContentResolver().openInputStream(uri);
            android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(in, null, o);
            if (in != null) in.close();
            return bmp;
        } catch (Exception e) {
            return null;
        }
    }

    private com.google.zxing.Result decodeBitmap(android.graphics.Bitmap bmp) throws Exception {
        int w = bmp.getWidth(), h = bmp.getHeight();
        int[] px = new int[w * h];
        bmp.getPixels(px, 0, w, 0, 0, w, h);

        com.google.zxing.LuminanceSource src = new com.google.zxing.RGBLuminanceSource(w, h, px);
        com.google.zxing.BinaryBitmap bb =
                new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(src));

        java.util.Map<com.google.zxing.DecodeHintType, Object> hints = new java.util.HashMap<>();
        hints.put(com.google.zxing.DecodeHintType.TRY_HARDER, Boolean.TRUE);

        return new com.google.zxing.MultiFormatReader().decode(bb, hints);
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
