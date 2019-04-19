import { achievements } from "./achievement";

export function vaultBoyIcon() {
    let perk = achievements.getLatestPerk();

    let href = "vaultBoy.png";
    if (perk != null) {
        href = perk.href;
    }
    return href;
}