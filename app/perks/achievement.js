import userActivity from "user-activity";
import goals from "user-activity";

// Perk class definition
class Perk {
    constructor(name, href, check) {
        this.name = name;
        this.href = href;
        this.check = check;

        this.achieved = false;
        this.achieved = this.isAchieved();
    }

    // Check and track achievement
    isAchieved() {
        if ( !this.achieved ) {
          if ( this.check() ) {
            this.achieved = true;

            currentDate = new Date();
            this.achieved_timestamp = currentDate.timestamp();
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

// List of current perks
class Perks {
    constructor() {
        this.date = new Date();
        this.perks = [
            new Perk("Action Boy", "perk-actionBoy.png", checkActionBoyPerk),
            new Perk("Action Points", "perk-actionPoints.png", checkActionPointsPerk),
            new Perk("Strong Back", "perk-strongBack.png", checkStrongBackPerk),
            new Perk("Endurance", "perk-endurance.png", checkEndurancePerk),
            new Perk("Strength", "perk-strength.png", checkStrengthPerk),
        ]
    }

    // Replace all perks with new objects
    updatePerks() {
        let newPerks = [];
        this.perks.forEach(function(perk) {
            newPerks.push(Perk(perk.name, perk.href, perk.check));
        });
        this.perks = newPerks;
    }

    getLatestPerk() {
        // Update perks when the date has changed
        let currentDate = new Date;
        if (this.date.toDateString() != currentDate.toDateString()) {
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
        return latest;
    }
}

export const achievements = new Perks();
