package org.pragyapravah.app.ui.webview

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class OfflineScreenTest {
  @get:Rule val composeTestRule = createAndroidComposeRule<ComponentActivity>()

  @Test
  fun retryButtonInvokesCallback() {
    var retried = false

    composeTestRule.setContent {
      OfflineScreen(onRetry = { retried = true })
    }

    composeTestRule.onNodeWithText("Network Connection Unavailable").assertIsDisplayed()
    composeTestRule.onNodeWithText("पुनः प्रयास करें / Retry").performClick()

    composeTestRule.runOnIdle {
      assertTrue(retried)
    }
  }
}
