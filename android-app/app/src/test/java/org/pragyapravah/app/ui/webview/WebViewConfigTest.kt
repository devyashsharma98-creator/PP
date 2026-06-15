package org.pragyapravah.app.ui.webview

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class WebViewConfigTest {
  @Test
  fun productionDefaultsUseExpectedHostAndSecureAccess() {
    assertEquals("about:blank", WebViewConfig.DefaultUrl)
    assertFalse(WebViewConfig.AllowFileAccess)
    assertFalse(WebViewConfig.AllowContentAccess)
    assertEquals(WebViewConfig.MixedContentMode.NeverAllow, WebViewConfig.DefaultMixedContentMode)
  }
}
