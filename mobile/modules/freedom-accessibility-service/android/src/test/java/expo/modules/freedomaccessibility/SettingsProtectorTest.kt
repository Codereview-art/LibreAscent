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
    fun samsungAccessibilityPackageIsRecognizedAsSettings() {
        assertTrue(SettingsProtector().matchesSettingsPkg("com.samsung.accessibility"))
    }

    @Test
    fun miuiSecurityCenterPackageIsRecognizedAsSettings() {
        assertTrue(SettingsProtector().matchesSettingsPkg("com.miui.securitycenter"))
    }

    @Test
    fun aospSettingsPackagesAreStillRecognized() {
        val protector = SettingsProtector()
        assertTrue(protector.matchesSettingsPkg("com.android.settings"))
        assertTrue(protector.matchesSettingsPkg("com.google.android.settings"))
    }

    @Test
    fun unrelatedPackageIsNotRecognizedAsSettings() {
        assertFalse(SettingsProtector().matchesSettingsPkg("com.android.chrome"))
    }

    @Test
    fun deviceAdminDeactivationForLibreAscentIsBlocked() {
        val protector = SettingsProtector()
        val texts = listOf("Device admin app", "LibreAscent", "Deactivate this device admin app")

        assertTrue(protector.shouldBlockSettingsTextsForTest(texts))
    }
}
