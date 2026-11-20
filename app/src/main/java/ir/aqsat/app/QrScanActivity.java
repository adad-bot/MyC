package ir.aqsat.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.hardware.Camera;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.util.HashMap;
import java.util.Map;

/**
 * اسکنر زندهٔ QR: پیش‌نمایش دوربین + رمزگشایی پیوسته + کادر راهنما.
 */
public class QrScanActivity extends Activity implements SurfaceHolder.Callback {

    private static final int REQ_CAM = 91;

    private SurfaceView surfaceView;
    private Camera camera;
    private Handler ui;
    private volatile boolean busy = false;
    private volatile boolean done = false;
    private volatile boolean ready = false;
    private volatile long lastDecode = 0;
    private BarcodeScanner mlkit = null;
    private Runnable focusTick = null;

    private static final int PREVIEW_W = 1280;
    private static final int PREVIEW_H = 720;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        // نسبت تصویر دوربین رعایت شود تا کشیده/بزرگ دیده نشود
        // پیش‌نمایش تمام‌صفحه (روشن‌تر و پایدارتر)
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int screenH = getResources().getDisplayMetrics().heightPixels;
        int boxW = (int) (Math.min(screenW, screenH) * 0.8);
        int boxH = (int) (screenH * 0.62);
        boxW = (int) (boxH * 9.0 / 16.0);

        surfaceView = new SurfaceView(this);
        FrameLayout.LayoutParams slp = new FrameLayout.LayoutParams(boxW, boxH);
        slp.gravity = Gravity.CENTER;
        root.addView(surfaceView, slp);
        surfaceView.getHolder().addCallback(this);

        surfaceView.setOnClickListener(v -> {
            try { if (camera != null) camera.autoFocus(null); } catch (Throwable ignored) { }
        });

        // کادر راهنما
        View frame = new View(this);
        int size = (int) (Math.min(boxW, boxH) * 0.78);
        GradientDrawable box = new GradientDrawable();
        box.setColor(0x11000000);
        box.setStroke(6, 0xFFFFFFFF);
        box.setCornerRadius(28);
        frame.setBackground(box);
        FrameLayout.LayoutParams flp = new FrameLayout.LayoutParams(size, size);
        flp.gravity = Gravity.CENTER;
        root.addView(frame, flp);

        TextView hint = new TextView(this);
        hint.setText("کد QR را داخل کادر بگیر");
        hint.setTextColor(Color.WHITE);
        hint.setTextSize(14);
        hint.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams tlp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tlp.gravity = Gravity.BOTTOM;
        tlp.bottomMargin = 140;
        root.addView(hint, tlp);

        // خط قرمز تراز، وسط کادر
        View line = new View(this);
        GradientDrawable lineBg = new GradientDrawable();
        lineBg.setColor(0xFFEF4444);
        line.setBackground(lineBg);
        FrameLayout.LayoutParams llp = new FrameLayout.LayoutParams((int) (boxW * 0.8), 6);
        llp.gravity = Gravity.CENTER;
        root.addView(line, llp);

        TextView close = new TextView(this);
        close.setText("بستن");
        close.setTextColor(Color.WHITE);
        close.setTextSize(15);
        close.setGravity(Gravity.CENTER);
        GradientDrawable cbg = new GradientDrawable();
        cbg.setColor(0xCC1F2937);
        cbg.setCornerRadius(26);
        close.setBackground(cbg);
        FrameLayout.LayoutParams clp = new FrameLayout.LayoutParams(160, 96);
        clp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        clp.topMargin = 70;
        close.setOnClickListener(v -> finishWith("ERR:CANCELLED"));
        root.addView(close, clp);

        setContentView(root);
        ui = new Handler(Looper.getMainLooper());

        try {
            BarcodeScannerOptions opts = new BarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_CODE_128,
                            Barcode.FORMAT_CODE_39, Barcode.FORMAT_DATA_MATRIX)
                    .build();
            mlkit = BarcodeScanning.getClient(opts);
        } catch (Throwable t) {
            mlkit = null;
        }

        if (checkSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            try {
                requestPermissions(new String[]{android.Manifest.permission.CAMERA}, REQ_CAM);
            } catch (Exception e) {
                finishWith("ERR:NOCAMERA");
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        super.onRequestPermissionsResult(code, perms, res);
        if (code == REQ_CAM) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            if (!ok) finishWith("ERR:NOPERM");
            else startCamera(surfaceView.getHolder());
        }
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        startCamera(holder);
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
        if (camera != null) {
            try {
                camera.stopPreview();
                camera.setPreviewDisplay(holder);
                camera.startPreview();
            } catch (Exception ignored) { }
        }
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        stopCamera();
    }

    private void startCamera(SurfaceHolder holder) {
        if (camera != null) return;
        try {
            camera = Camera.open();

            try { camera.setDisplayOrientation(displayRotation()); } catch (Throwable ignored) { }

            Camera.Parameters p = camera.getParameters();

            Camera.Size best = null;
            try {
                for (Camera.Size s : p.getSupportedPreviewSizes()) {
                    float ratio = (float) s.width / (float) s.height;
                    if (Math.abs(ratio - 16f / 9f) > 0.12f) continue;
                    if (best == null || Math.abs(s.width - PREVIEW_W) < Math.abs(best.width - PREVIEW_W)) best = s;
                }
                if (best == null) {
                    for (Camera.Size s : p.getSupportedPreviewSizes()) {
                        if (best == null || Math.abs(s.width - PREVIEW_W) < Math.abs(best.width - PREVIEW_W)) best = s;
                    }
                }
            } catch (Throwable ignored) { }
            if (best != null) p.setPreviewSize(best.width, best.height);

            try { p.setZoom(0); } catch (Throwable ignored) { }

            // انتخاب بهترین حالت فوکوس موجود روی دستگاه
            try {
                java.util.List<String> modes = p.getSupportedFocusModes();
                String chosen = null;
                String[] prefer = {
                        Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE,
                        Camera.Parameters.FOCUS_MODE_CONTINUOUS_VIDEO,
                        Camera.Parameters.FOCUS_MODE_MACRO,
                        Camera.Parameters.FOCUS_MODE_AUTO
                };
                for (String want : prefer) {
                    if (modes != null && modes.contains(want)) { chosen = want; break; }
                }
                if (chosen != null) p.setFocusMode(chosen);
            } catch (Throwable ignored) { }
            try { camera.setParameters(p); } catch (Throwable ignored) { }

            camera.setPreviewDisplay(holder);
            camera.setPreviewCallback((data, cam) -> onFrame(data, cam));
            camera.startPreview();

            // زوم ملایم برای بزرگ‌تر شدن QR چک (اگر پشتیبانی شود)
            try {
                Camera.Parameters zp = camera.getParameters();
                if (zp.isZoomSupported() && zp.getMaxZoom() > 0) {
                    java.util.List<Integer> ratios = zp.getZoomRatios();
                    int bestZ = 0;
                    for (int zi = 0; zi < ratios.size(); zi++) {
                        if (ratios.get(zi) <= 200) bestZ = zi;
                    }
                    zp.setZoom(Math.min(bestZ, zp.getMaxZoom()));
                    camera.setParameters(zp);
                }
            } catch (Throwable ignored) { }

            // فوکوس دوره‌ای: عامل اصلی تاری تصویر
            if (focusTick == null) {
                focusTick = new Runnable() {
                    @Override public void run() {
                        try { if (camera != null) camera.autoFocus(null); } catch (Throwable ignored) { }
                        if (ui != null) ui.postDelayed(this, 1100);
                    }
                };
            }
            ui.removeCallbacks(focusTick);
            ui.postDelayed(focusTick, 400);

            // کمی فرصت بده تا کاربر کد را داخل کادر قرار دهد
            ui.postDelayed(() -> ready = true, 700);

            // اگر تا ۲۵ ثانیه چیزی خوانده نشد، راهنمایی بده
            ui.postDelayed(() -> { if (!done) finishWith("ERR:TIMEOUT"); }, 25000);
        } catch (Throwable t) {
            finishWith("ERR:NOCAMERA");
        }
    }

    private int displayRotation() {
        try {
            Camera.CameraInfo info = new Camera.CameraInfo();
            Camera.getCameraInfo(0, info);

            int rotation = getWindowManager().getDefaultDisplay().getRotation();
            int degrees = 0;
            if (rotation == android.view.Surface.ROTATION_90) degrees = 90;
            else if (rotation == android.view.Surface.ROTATION_180) degrees = 180;
            else if (rotation == android.view.Surface.ROTATION_270) degrees = 270;

            int result;
            if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
                result = (info.orientation + degrees) % 360;
                result = (360 - result) % 360;
            } else {
                result = (info.orientation - degrees + 360) % 360;
            }
            return result;
        } catch (Throwable t) {
            return 90;
        }
    }

    private void stopCamera() {
        if (camera == null) return;
        try {
            camera.setPreviewCallback(null);
            camera.stopPreview();
        } catch (Exception ignored) { }
        try { camera.release(); } catch (Exception ignored) { }
        camera = null;
    }


    /** هر متن معناداری از QR پذیرفته می‌شود؛ تفکیک فیلدها کارِ جاوااسکریپت است */
    private boolean looksLikeCheque(String t) {
        if (t == null) return false;
        return t.trim().length() >= 4;
    }
    private void onFrame(byte[] data, Camera cam) {
        if (busy || done || !ready || data == null) return;

        long nowMs = System.currentTimeMillis();
        if (nowMs - lastDecode < 110) return;
        lastDecode = nowMs;

        busy = true;

        final byte[] copy = data.clone();

        int pw = PREVIEW_W;
        int ph = PREVIEW_H;
        try {
            Camera.Size s = cam.getParameters().getPreviewSize();
            if (s != null) { pw = s.width; ph = s.height; }
        } catch (Exception ignored) { }

        final int w = pw;
        final int h = ph;

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mlkit != null) {
                        InputImage img = InputImage.fromByteArray(copy, w, h, displayRotation(),
                                InputImage.IMAGE_FORMAT_NV21);

                        mlkit.process(img)
                                .addOnSuccessListener((java.util.List<Barcode> codes) -> {
                                    try {
                                        for (Barcode b : codes) {
                                            String v = b.getRawValue();
                                            if (v != null && v.trim().length() > 3) {
                                                finishWith(v);
                                                return;
                                            }
                                        }
                                    } catch (Throwable ignored) { }
                                    busy = false;
                                })
                                .addOnFailureListener(e -> busy = false)
                                .addOnCanceledListener(() -> busy = false);
                    } else {
                        busy = false;
                    }
                } catch (Throwable ignored) {
                    busy = false;
                }
            }
        }).start();
    }

    private void finishWith(String text) {
        if (done) return;
        done = true;
        final String t = text;
        runOnUiThread(() -> {
            try {
                Intent out = new Intent();
                out.putExtra("text", t);
                setResult(RESULT_OK, out);
            } catch (Exception ignored) { }
            finish();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopCamera();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (surfaceView != null && surfaceView.getHolder().getSurface() != null && camera == null) {
            startCamera(surfaceView.getHolder());
        }
    }

    @Override
    protected void onDestroy() {
        try { if (mlkit != null) mlkit.close(); } catch (Throwable ignored) { }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        finishWith("ERR:CANCELLED");
    }
}
