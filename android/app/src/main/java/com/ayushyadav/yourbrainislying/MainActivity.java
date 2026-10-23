package com.ayushyadav.yourbrainislying;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String APP_ROOT = "file:///android_asset/www/";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(8, 11, 22));
        getWindow().setNavigationBarColor(Color.rgb(8, 11, 22));
        getWindow().getDecorView().setSystemUiVisibility(0);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8, 11, 22));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.addJavascriptInterface(new DownloadBridge(), "AndroidBridge");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;

                String url = request.getUrl().toString();
                if (url.startsWith(APP_ROOT)) return false;

                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception error) {
                        Toast.makeText(MainActivity.this, "Could not open that link.", Toast.LENGTH_SHORT).show();
                    }
                }
                // Never allow the application web view to navigate to arbitrary file/content schemes.
                return true;
            }
        });

        setContentView(webView);
        if (savedInstanceState == null) {
            webView.loadUrl(APP_ROOT + "index.html");
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private final class DownloadBridge {
        @JavascriptInterface
        public void saveTextFile(String requestedName, String content, String requestedMimeType) {
            if (content == null || content.length() > 10_000_000) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "That export is too large to save.", Toast.LENGTH_LONG).show());
                return;
            }
            runOnUiThread(() -> saveDownload(requestedName, content, requestedMimeType));
        }
    }

    private void saveDownload(String requestedName, String content, String requestedMimeType) {
        String safeName = requestedName == null ? "brain-export.txt" : requestedName
                .replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "-");
        if (safeName.trim().isEmpty()) safeName = "brain-export.txt";
        String mimeType = requestedMimeType == null ? "text/plain" : requestedMimeType;
        if (!mimeType.matches("[A-Za-z0-9.+-]+/[A-Za-z0-9.+-]+(?:;charset=utf-8)?")) mimeType = "text/plain";

        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri fileUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (fileUri == null) {
            Toast.makeText(this, "Could not create the download.", Toast.LENGTH_LONG).show();
            return;
        }

        try (OutputStream stream = getContentResolver().openOutputStream(fileUri)) {
            if (stream == null) throw new IOException("Download stream is unavailable");
            stream.write(content.getBytes(StandardCharsets.UTF_8));
            ContentValues finished = new ContentValues();
            finished.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContentResolver().update(fileUri, finished, null, null);
            Toast.makeText(this, "Saved to Downloads: " + safeName, Toast.LENGTH_LONG).show();
        } catch (IOException error) {
            getContentResolver().delete(fileUri, null, null);
            Toast.makeText(this, "Could not save the export.", Toast.LENGTH_LONG).show();
        }
    }
}

