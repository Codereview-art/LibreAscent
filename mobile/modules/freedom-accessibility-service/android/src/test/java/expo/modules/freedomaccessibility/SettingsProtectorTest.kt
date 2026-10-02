package expo.modules.freedomaccessibility

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class SettingsProtectorTest {
    @Test
    fun networkVpnPageForLibreAscentIsNotBlockedByGenericOffText() {
        val protector = SettingsProtector()
        val texts = listOf("Network & internet", "VPN", "LibreAscent", "Off")

        assertFalse(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun accessibilityPageForLibreAscentIsBlockedWhenTurnOffIsVisible() {
        val protector = SettingsProtector()
        val texts = listOf("Accessibility", "LibreAscent", "Turn off LibreAscent")

        assertTrue(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun privateDnsDialogIsBlockedWithoutAnyLibreAscentText() {
        val protector = SettingsProtector()
        // Settings' Private DNS dialog as rendered: it never names this app.
        val texts = listOf(
            "Private DNS", "Off", "Automatic", "Private DNS provider hostname",
            "Enter hostname of DNS provider", "Cancel", "Save"
        )

        assertTrue(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun networkPageListingPrivateDnsIsNotBlocked() {
        val protector = SettingsProtector()
        // The Network & internet list shows the Private DNS row, not the dialog.
        val texts = listOf("Network & internet", "Private DNS", "Automatic", "VPN", "LibreAscent")

        assertFalse(protector.shouldBlockSettingsTextsForTest(texts))
    }
}
