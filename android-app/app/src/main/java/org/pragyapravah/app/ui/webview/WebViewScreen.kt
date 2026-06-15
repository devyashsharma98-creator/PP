package org.pragyapravah.app.ui.webview

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import org.pragyapravah.app.theme.BrandSaffron
import org.pragyapravah.app.theme.ParchmentBg
import org.pragyapravah.app.theme.DarkInkBg
import org.pragyapravah.app.theme.LightParchmentText
import org.pragyapravah.app.theme.DeepInkText
import org.pragyapravah.app.theme.SaffronDarkAccent
import kotlin.math.cos
import kotlin.math.sin

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    modifier: Modifier = Modifier,
    url: String = WebViewConfig.DefaultUrl
) {
    val isDark = isSystemInDarkTheme()
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isInitialLoadComplete by remember { mutableStateOf(false) }
    var loadProgress by remember { mutableFloatStateOf(0f) }
    var isError by remember { mutableStateOf(false) }
    var reloadKey by remember { mutableIntStateOf(0) }

    // Intercept back presses to navigate WebView history if possible
    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        // WebView container
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        allowFileAccess = WebViewConfig.AllowFileAccess
                        allowContentAccess = WebViewConfig.AllowContentAccess
                        cacheMode = WebSettings.LOAD_DEFAULT
                        mixedContentMode = WebViewConfig.mixedContentModeValue(WebViewConfig.DefaultMixedContentMode)
                        userAgentString = "$userAgentString PragyaPravahAndroid"
                    }

                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, pageUrl: String?, favicon: Bitmap?) {
                            super.onPageStarted(view, pageUrl, favicon)
                            isError = false
                        }

                        override fun onPageFinished(view: WebView?, pageUrl: String?) {
                            super.onPageFinished(view, pageUrl)
                            if (!isError) {
                                isInitialLoadComplete = true
                            }
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            super.onReceivedError(view, request, error)
                            if (request?.isForMainFrame == true) {
                                isError = true
                                isInitialLoadComplete = true
                            }
                        }
                    }

                    webChromeClient = object : android.webkit.WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            super.onProgressChanged(view, newProgress)
                            loadProgress = newProgress / 100f
                        }
                    }

                    loadUrl(url)
                    webViewInstance = this
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Loading Progress Bar at the top
        if (loadProgress < 1f && !isError) {
            LinearProgressIndicator(
                progress = { loadProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .align(Alignment.TopStart),
                color = if (isDark) SaffronDarkAccent else BrandSaffron,
                trackColor = Color.Transparent
            )
        }

        // Offline / Error screen
        if (isError) {
            OfflineScreen(
                onRetry = {
                    isError = false
                    isInitialLoadComplete = false
                    loadProgress = 0f
                    reloadKey += 1
                    webViewInstance?.loadUrl(url)
                }
            )
        }

        // Splash Transition Overlay
        AnimatedVisibility(
            visible = !isInitialLoadComplete,
            exit = fadeOut(animationSpec = tween(durationMillis = 800))
        ) {
            SplashScreenOverlay()
        }
    }
}

@Composable
fun SplashScreenOverlay() {
    val isDark = isSystemInDarkTheme()
    val bgColor = if (isDark) DarkInkBg else ParchmentBg
    val textColor = if (isDark) LightParchmentText else DeepInkText
    val accentColor = if (isDark) SaffronDarkAccent else BrandSaffron

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        MandalaSeal(color = accentColor, modifier = Modifier.size(160.dp))

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "प्रज्ञा प्रवाह",
            color = textColor,
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "PRAGYA PRAVAH",
            color = textColor.copy(alpha = 0.7f),
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 2.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(48.dp))

        CircularProgressIndicator(
            color = accentColor,
            strokeWidth = 3.dp,
            modifier = Modifier.size(36.dp)
        )
    }
}

@Composable
fun MandalaSeal(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val center = Offset(size.width / 2, size.height / 2)
        val outerRadius = size.width * 0.45f
        val innerRadius = size.width * 0.35f
        val coreRadius = size.width * 0.12f

        drawCircle(
            color = color,
            radius = outerRadius,
            style = Stroke(width = 2.dp.toPx())
        )

        drawCircle(
            color = color.copy(alpha = 0.5f),
            radius = outerRadius - 4.dp.toPx(),
            style = Stroke(width = 1.dp.toPx())
        )

        drawCircle(
            color = color,
            radius = innerRadius,
            style = Stroke(width = 1.5.dp.toPx())
        )

        val spokesCount = 12
        for (i in 0 until spokesCount) {
            val angle = (i * (360f / spokesCount)) * (Math.PI / 180f).toFloat()
            val startPoint = Offset(
                x = center.x + coreRadius * cos(angle),
                y = center.y + coreRadius * sin(angle)
            )
            val endPoint = Offset(
                x = center.x + innerRadius * cos(angle),
                y = center.y + innerRadius * sin(angle)
            )
            drawLine(
                color = color.copy(alpha = 0.8f),
                start = startPoint,
                end = endPoint,
                strokeWidth = 1.5.dp.toPx()
            )
        }

        drawCircle(
            color = color,
            radius = coreRadius,
            style = Stroke(width = 2.5.dp.toPx())
        )
        drawCircle(
            color = color.copy(alpha = 0.3f),
            radius = coreRadius - 3.dp.toPx()
        )
    }
}

@Composable
fun OfflineScreen(onRetry: () -> Unit) {
    val isDark = isSystemInDarkTheme()
    val bgColor = if (isDark) DarkInkBg else ParchmentBg
    val textColor = if (isDark) LightParchmentText else DeepInkText
    val accentColor = if (isDark) SaffronDarkAccent else BrandSaffron

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(contentAlignment = Alignment.Center) {
            MandalaSeal(color = textColor.copy(alpha = 0.2f), modifier = Modifier.size(140.dp))
            Canvas(modifier = Modifier.size(64.dp)) {
                val w = size.width
                val h = size.height
                val path = Path().apply {
                    moveTo(w / 2, 8.dp.toPx())
                    lineTo(w - 8.dp.toPx(), h - 8.dp.toPx())
                    lineTo(8.dp.toPx(), h - 8.dp.toPx())
                    close()
                }
                drawPath(path, color = accentColor, style = Stroke(width = 3.dp.toPx()))
                drawCircle(
                    color = accentColor,
                    radius = 3.dp.toPx(),
                    center = Offset(w / 2, h - 18.dp.toPx())
                )
                drawLine(
                    color = accentColor,
                    start = Offset(w / 2, 24.dp.toPx()),
                    end = Offset(w / 2, h - 26.dp.toPx()),
                    strokeWidth = 3.5.dp.toPx()
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "सम्पर्क टूट गया है",
            color = textColor,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Network Connection Unavailable",
            color = textColor.copy(alpha = 0.8f),
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "कृपया इंटरनेट कनेक्शन की जांच करें और पुनः प्रयास करें।\nPlease verify your internet connection and try again.",
            color = textColor.copy(alpha = 0.6f),
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = accentColor,
                contentColor = if (isDark) DarkInkBg else ParchmentBg
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .height(48.dp)
                .fillMaxWidth(0.6f)
        ) {
            Text(
                text = "पुनः प्रयास करें / Retry",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}
