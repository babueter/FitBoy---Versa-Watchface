import userActivity from "user-activity";
import goals from "user-activity";
import { BodyPresenceSensor } from "body-presence";
import document from "document";


// Display perk details to the user
const perkCard = document.getElementById("perkCard");
const perkCardIcon = document.getElementById("perkCardIcon");
const perkCardName = document.getElementById("perkCardName");

// Perk class definition
class Perk {
    constructor(name, href, check) {
        this.name = name;
        this.href = href;
        this.check = check;
        this.notified = false;

        this.achieved = false;
        this.achieved = this.isAchieved();
    }

    // Check and track achievement
    isAchieved() {
        if ( !this.achieved ) {
          if ( this.check() ) {
            console.log("perk: newly achieved "+this.name);
            this.achieved = true;

            let currentDate = new Date();
            this.achieved_timestamp = currentDate.getTime();
          }
        }
        return this.achieved;
    }
}

// Action Boy perk is achieved when active minutes goal has been met
function checkActionBoyPerk() {
    let amValue = userActivity.today.adjusted["activeMinutes"];
    return (amValue >= goals.activeMinutes);
}
// Action points are granted when distance goal has been met
function checkActionPointsPerk() {
    let distValue = userActivity.today.adjusted["distance"];
    return (distValue >= goals.distance);
}
// Strong back is achieved when elevation goal has been met
function checkStrongBackPerk() {
    let elevValue = userActivity.today.adjusted["elevationGain"];
    return (elevValue >= goals.elevationGain);
}
// Endurance is gained when calories goal has been met
function checkEndurancePerk() {
    let calsValue = userActivity.today.adjusted["calories"];
    return (calsValue >= goals.calories);
}
// Strength perk is achieved when all 4 daily goals are met
function checkStrengthPerk() {
    return (
        checkActionBoyPerk() &&
        checkActionPointsPerk() &&
        checkStrongBackPerk() &&
        checkEndurancePerk()
    )
}
// Lovers Embrace is earned when wearing the device on Valentines day or Sweetest day
function checkLoversEmbrace() {
    let currentDate = new Date();
    if (
        !(currentDate.monthIndex == 1 && currentDate.day == 14) &&
        !(currentDate.monthIndex == 9 && currentDate.day == 19)
    ) {
        return false;
    }

    // Check body presence only if the device has this feature
    let presence = true;
    if (BodyPresenceSensor) {
        let bodyPresence = new BodyPresenceSensor();
        presence = bodyPresence.presence
    }
    return presence;
}

// List of current perks
class Perks {
    constructor() {
        this.date = new Date();
        console.log("perk: creating new Perks: "+this.date);
        this.perks = [
            new Perk("Action Boy", "perk-actionBoy.png", checkActionBoyPerk),
            new Perk("Action Points", "perk-actionPoints.png", checkActionPointsPerk),
            new Perk("Strong Back", "perk-strongBack.png", checkStrongBackPerk),
            new Perk("Endurance", "perk-endurance.png", checkEndurancePerk),
            new Perk("Strength", "perk-strength.png", checkStrengthPerk),
            new Perk("Lovers Embrace", "perk-loversEmbrace.png", checkLoversEmbrace)
        ]
        this.notifyingUser = false;
    }

    // Replace all perks with new objects
    updatePerks() {
        let newPerks = [];
        this.perks.forEach(function(perk) {
            newPerks.push(Perk(perk.name, perk.href, perk.check));
        });
        this.perks = newPerks;
    }

    // Display the perk card
    showPerkCard(perk) {
        perkCardIcon.href = perk.href;
        perkCardName.text = perk.name.toUpperCase();
        perk.notified = true;

        // Start the animation after a 5 second delay
        setTimeout(function() {
            perkCard.animate("enable");
        }, 5000);
    }

    // Notify the user of the first achieved perk card
    notifyUser() {
        // Avoid notifying two achievements at once
        if (this.notifyingUser) {
            return;
        }
        this.notifyingUser = true;

        let i;
        let len = this.perks.length;
        for (i=0; i < len; i++) {
            let perk = this.perks[i];
            if (perk.achieved && !perk.notified) {
                console.log("perk: notifying user of achievment: "+perk.name);
                this.showPerkCard(perk);
                break;
            }
        }
    }

    getLatestPerk() {
        // Update perks when the date has changed
        let currentDate = new Date;
        if (this.date.toDateString() != currentDate.toDateString()) {
            console.log("perk: replacing perk cards: "+this.date.toDateString() + " != " + currentDate.toDateString());
            this.updatePerks();
            this.date = currentDate;
        }

        // Return the latest perk achieved or null
        let latest = null;
        let perk;
        this.perks.forEach(function(perk) {
            if (perk.isAchieved()) {
                if (latest != null) {
                    if (perk.achieved_timestamp > latest.achieved_timestamp) {
                        latest = perk;
                    }
                } else {
                    latest = perk;
                }
            }
        })

        // Notify user of any new perks achieved
        this.notifyUser();

        return latest;
    }
}

export const achievements = new Perks();

// Close the perk card window and notify the user of additional achievements
perkCard.onmousedown = function(e) {
    perkCard.style.opacity = 0.0;

    achievements.notifyingUser = false;
    achievements.notifyUser();
}

