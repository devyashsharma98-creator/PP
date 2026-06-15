package org.pragyapravah.app.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = SaffronDarkAccent,
    onPrimary = DarkInkBg,
    secondary = ScholarlyMarigold,
    onSecondary = DarkInkBg,
    tertiary = ScholarlyMaroon,
    background = DarkInkBg,
    onBackground = LightParchmentText,
    surface = DarkSlateSurface,
    onSurface = LightParchmentText,
    error = ErrorColorDark
)

private val LightColorScheme = lightColorScheme(
    primary = BrandSaffron,
    onPrimary = ParchmentBg,
    secondary = ScholarlyMaroon,
    onSecondary = ParchmentBg,
    tertiary = ScholarlyMarigold,
    background = ParchmentBg,
    onBackground = DeepInkText,
    surface = ParchmentSurface,
    onSurface = DeepInkText,
    error = ErrorColor
)

@Composable
fun PragyaPravahTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // We disable dynamic color by default to preserve the institutional parchment & saffron branding
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }
      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
