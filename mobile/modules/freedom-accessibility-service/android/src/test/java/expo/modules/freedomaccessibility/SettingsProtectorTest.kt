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
    fun vpnListPageShowingLibreAscentConnectedIsNotBlocked() {
        val protector = SettingsProtector()
        val texts = listOf("Network & internet", "VPN", "LibreAscent", "Connected")

        assertFalse(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun vpnDetailPageForLibreAscentIsBlockedWhenForgetVpnIsVisible() {
        val protector = SettingsProtector()
        val texts = listOf("LibreAscent", "Always-on VPN", "Block connections without VPN", "Forget VPN")

        assertTrue(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun vpnDetailPageForAnotherAppIsNotBlocked() {
        val protector = SettingsProtector()
        val texts = listOf("Other VPN", "Always-on VPN", "Forget VPN")

        assertFalse(protector.shouldBlockSettingsTextsForTest(texts))
    }

    @Test
    fun consentDialogForAnotherVpnAppIsBlocked() {
        val protector = SettingsProtector()
        val texts = listOf(
            "Connection request",
            "Other VPN wants to set up a VPN connection that allows it to monitor network traffic. Only accept if you trust the source.",
            "Cancel",
            "OK"
        )

        assertTrue(protector.shouldBlockVpnDialogTextsForTest(texts))
    }

    @Test
    fun consentDialogForLibreAscentIsNotBlocked() {
        val protector = SettingsProtector()
        val texts = listOf(
            "Connection request",
            "LibreAscent wants to set up a VPN connection that allows it to monitor network traffic. Only accept if you trust the source.",
            "Cancel",
            "OK"
        )

        assertFalse(protector.shouldBlockVpnDialogTextsForTest(texts))
    }

    @Test
    fun consentDialogThatHasNotRenderedIsNotBlocked() {
        // The first window event can land before the dialog body exists. An
        // empty tree names nobody, and must not bounce LibreAscent's own request.
        val protector = SettingsProtector()

        assertFalse(protector.shouldBlockVpnDialogTextsForTest(emptyList()))
    }

    @Test
    fun consentDialogWithOnlyTitleAndButtonsRenderedIsNotBlocked() {
        // Title and buttons can land before the body that names the app.
        val protector = SettingsProtector()
        val texts = listOf("Connection request", "Cancel", "OK")

        assertFalse(protector.shouldBlockVpnDialogTextsForTest(texts))
    }

    @Test
    fun consentDialogForLibreAscentIsNotBlockedWhenTheLabelIsGluedOrQuoted() {
        // The rule is inverted, so a label that a whole-word match would miss
        // must still count as naming LibreAscent.
        val protector = SettingsProtector()

        assertFalse(protector.shouldBlockVpnDialogTextsForTest(listOf("连接请求", "LibreAscent想要设置一个VPN连接。")))
        assertFalse(protector.shouldBlockVpnDialogTextsForTest(listOf("Demande de connexion", "«LibreAscent» veut configurer une connexion VPN.")))
    }
}
