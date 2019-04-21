import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import { HeartRateSensor } from "heart-rate";
import userActivity from "user-activity";
import { today } from "user-activity";
import { battery } from "power";
import { me as device } from "device";
import { goals } from "user-activity";
import { BodyPresenceSensor } from "body-presence";

// Update the clock every minute
// We could do this in seconds, but there's really no need.
clock.granularity = "minutes";

// Get a handle on the <text> element
const myLabel = document.getElementById("myLabel");
const clockTime = document.getElementById("clockTime");
const steps = document.getElementById("steps");
const hrate = document.getElementById("hrate");
const progress = document.getElementById("progress");
const todayDate = document.getElementById("todayDate");
const todayDay = document.getElementById("todayDay");
const todayMonth = document.getElementById("todayMonth");
const calProgressBar = document.getElementById("calProgressBar");
const activeProgressBar  = document.getElementById("activeProgressBar");
const distProgressBar = document.getElementById("distProgressBar");
const stairsProgressBar = document.getElementById("stairsProgressBar");
const batteryBar = document.getElementById("batteryBar");
const heartIcon = document.getElementById("heartIcon");
const heartIconBorder = document.getElementById("heartIconBorder");
const batteryText = document.getElementById("battery");

// Keep vaultBoy Icon up to date
const vaultBoy = document.getElementById("vaultBoy")

// Get heart rate from watch
const hrm = new HeartRateSensor();

hrm.onreading = function() {
  hrate.text = `${hrm.heartRate}`;
  
  if (hrm.heartRate > 131) {
    heartIconBorder.style.fill = "#FF0000";
    heartIcon.style.fill = "#FF0000";
  }
  else if (hrm.heartRate > 93){
    heartIconBorder.style.fill = "#17E268";
    heartIcon.style.fill = "#17E268";
  }
  else{
    heartIconBorder.style.fill = "#17E268";
    heartIcon.style.fill = "#01270E";
  }
}

hrm.start();
progress.text = 'S    T    A    T    S';

// For debugging purposes
let DEMO = false;
let DEMO_COUNT = 1;


// Display perk details to the user
const perkCard = document.getElementById("perkCard");
const perkCardIcon = document.getElementById("perkCardIcon");
const perkCardName = document.getElementById("perkCardName");
const perkCardCover = document.getElementById("perkCardCover");

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
    if (DEMO && DEMO_COUNT > 1) {
        return true;
    }
    let amValue = userActivity.today.adjusted["activeMinutes"];
    console.log("perk: checkActionBoyPerk: " + amValue + " vs "+ goals.activeMinutes);
    return (amValue >= goals.activeMinutes);
}
// Action points are granted when calories goal has been met
function checkActionPointsPerk() {
    if (DEMO && DEMO_COUNT > 2) {
        return true;
    }
    let calsValue = userActivity.today.adjusted["calories"];
    console.log("perk: checkActionPointsPerk: " + calsValue + " vs "+ goals.calories);
    return (calsValue >= goals.calories);
}
// Strong back is achieved when elevation goal has been met
function checkStrongBackPerk() {
    if (DEMO && DEMO_COUNT > 3) {
        return true;
    }
    let elevValue = userActivity.today.adjusted["elevationGain"];
    console.log("perk: checkStrongBackPerk: " + elevValue + " vs "+ goals.elevationGain);
    return (elevValue >= goals.elevationGain);
}
// Endurance is gained when distance goal has been met
function checkEndurancePerk() {
    if (DEMO && DEMO_COUNT > 4) {
        return true;
    }
    let distValue = userActivity.today.adjusted["distance"];
    console.log("perk: checkEndurancePerk: " + distValue + " vs "+ goals.distance);
    return (distValue >= goals.distance);
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
    if (DEMO && DEMO_COUNT > 5) {
        return true;
    }
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

        // Start the animation
        perkCard.style.opacity = 1.0;
        perkCardCover.animate("enable");
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
        DEMO_COUNT++;

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

const achievements = new Perks();

// Close the perk card window and notify the user of additional achievements
const perkCard = document.getElementById("perkCard");
perkCard.onmousedown = function(e) {
    perkCard.style.opacity = 0.0;

    achievements.notifyingUser = false;
    achievements.notifyUser();
}

// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
  let perk = achievements.getLatestPerk();
  if (perk == null) {
    vaultBoy.href = "vaultBoy.png";
  } else {
    vaultBoy.href = perk.href;
  }

  let today = evt.date;
  let hours = today.getHours();
  let month = 'NAN';
  let day = 'NANSDAY'
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(today.getMinutes());
  clockTime.text = `${hours}:${mins}`;
  //clockTime.text = `12:55`;
  
  let stepsValue = (userActivity.today.adjusted["steps"] || 0);
  steps.text = stepsValue;
  //steps.text = '777777';
  
  let todaydayday = today.getDate();
  //let todaydayday = '31';
  let monthIndex = today.getMonth() + 1;

  if (monthIndex === 1 && todaydayday === 18){
    progress.text = 'B    -    D    A    Y';
  }
  else if (monthIndex === 2 && todaydayday === 14){
    progress.text = 'L    O    V    E    U';
  }
  else if (monthIndex === 2 && todaydayday === 22){
    progress.text = 'S    Q    U    I    D';
  }
  else if (monthIndex === 10 && todaydayday === 24){
    progress.text = 'A    D    O    R    E';
  }
  else if (monthIndex === 12 && todaydayday === 3){
    progress.text = 'H    B    B    E    N';
  }
  else if (monthIndex === 12 && todaydayday === 25){
    progress.text = 'X    -    M    A    S';
  }
  else {
    progress.text = 'S    T    A    T    S';
  }

  switch (today.getDay()) {
    case 0:
      day = "SUNDAY";
      break;
    case 1:
      day = "MONDAY";
      break;
    case 2:
      day = "TUESDAY";
      break;
    case 3:
      day = "WEDNESDAY";
      break;
    case 4:
      day = "THURSDAY";
      break;
    case 5:
      day = "FRIDAY";
      break;
    case 6:
      day = "SATURDAY";
      break;
  }
  
  switch (today.getMonth()) {
    case 0:
      month = "JAN";
      break;
    case 1:
      month = "FEB";
      break;
    case 2:
      month = "MAR";
      break;
    case 3:
      month = "APR";
      break;
    case 4:
      month = "MAY";
      break;
    case 5:
      month = "JUN";
      break;
    case 6:
      month = "JUL";
      break;
    case 7:
      month = "AUG";
      break;
    case 8:
      month = "SEP";
      break;
    case 9:
      month = "OCT";
      break;
    case 10:
      month = "NOV";
      break;
    case 11:
      month = "DEC";
      break;
  }
  
  todayDay.text = `${day}`;
  todayMonth.text = `${month}`;
  todayDate.text = `${todaydayday}`;
  
  let calsValue = userActivity.today.adjusted["calories"];
  let amValue = userActivity.today.adjusted["activeMinutes"];
  let distValue = userActivity.today.adjusted["distance"];
  let elevValue = userActivity.today.adjusted["elevationGain"];
  let batteryValue = battery.chargeLevel; 
  
  const calGoalPercent  = Math.min(100, Math.round(calsValue / goals.calories * 100));
  calProgressBar.width = Math.round(215 * calGoalPercent / 100);
  
  const amGoalPercent  = Math.min(100, Math.round(amValue / goals.activeMinutes * 100));
  activeProgressBar.width = Math.round(215 * amGoalPercent / 100);
  
  const distGoalPercent  = Math.min(100, Math.round(distValue / goals.distance * 100));
  distProgressBar.width = Math.round(215 * distGoalPercent / 100);
  
  const elevGoalPercent  = Math.min(100, Math.round(elevValue / goals.elevationGain * 100));
  stairsProgressBar.width = Math.round(215 * elevGoalPercent / 100);

  batteryBar.width = batteryValue;
  //batteryBar.width = 65;
  
  if (batteryBar.width < 51){
    batteryBar.style.fill = "#FFFF00";  // Yellow if below (or at) 50%
  }
  if (batteryBar.width < 26){
    batteryBar.style.fill = "#FF0000";  // Red if below (or at) 25%
  }
  
  batteryText.text = `${batteryBar.width}/100`;
}


