package org.pragyapravah.app.ui.webview

import android.webkit.WebSettings
import org.pragyapravah.app.BuildConfig

object WebViewConfig {
  val DefaultUrl: String = BuildConfig.WEBVIEW_BASE_URL
  const val AllowFileAccess: Boolean = false
  const val AllowContentAccess: Boolean = false
  val DefaultMixedContentMode: MixedContentMode = MixedContentMode.NeverAllow

  enum class MixedContentMode {
    NeverAllow,
  }

  fun mixedContentModeValue(mode: MixedContentMode): Int =
    when (mode) {
      MixedContentMode.NeverAllow -> WebSettings.MIXED_CONTENT_NEVER_ALLOW
    }
}
