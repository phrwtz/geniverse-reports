//org = new BioLogica.Organism(BioLogica.Species.Drake,"a:T,b:T,a:M,b:m,a:W,b:W,a:h,b:h,a:C,b:C,a:B,b:B,a:fl,b:Fl,a:Hl,b:Hl,a:A1,b:A1,a:D,a:Bog,a:rh",BioLogica.MALE)
//org.getAllCharacteristics()

//"a:T,m,W,h;b:t,h"

// "Tt WW flFl W_ _A1"

var traitCodes = {
    st: "Steel",
    co: "Copper",
    ar: "Silver",
    go: "Gold",
    ch: "Charcoal",
    ea: "Lava",
    du: "Ash",
    sa: "Sand",
    wing: "Wings",
    noWing: "No wings",
    a5: "Five armor",
    a3: "Three armor",
    a1: "One armor",
    a0: "No armor",
    flair: "Long tail",
    kink: "Kinked tail",
    short: "Short tail",
    horn: "Horns",
    noHorn: "No horns",
    rostral: "Nose spike",
    noRostral: "No nose spike",
    "bogbreath.png": "Bog breath",
    "healthy.png": "Healthy"
};

function getTraitsFromImage(URL) {
    var URLArray = URL.split("/");
    var traitArray = URLArray[URLArray.length - 1].split("_");
    var healthyTrait = traitArray[traitArray.length - 1].split(".")[0]; //remove .png from last trait
    traitArray.splice(traitArray.length - 1, 1, healthyTrait); // insert it into the array
    traitArray.splice(1, 1); // remove sex as trait (to be retrieved separately)
    // change the single-value version of the limbs trait into two separate traits
    // for forelimbs and hindlimbsx
    // (traitArray[0] == "st") ? traitArray[0] = "steel": traitArray[0] = "charcoal";
    // (traitArray[1] == "wing") ? traitArray[1] = "wings": traitArray[1] = "NoWings"

    for (var i = 0; i < 2; i++) {
        traitArray[i] = traitCodes[traitArray[i]];
    }
    var forelimbTrait = "No forelimbs";
    var hindlimbTrait = "No hindlimbs";
    if (traitArray[2] == "forelimbs") {
        forelimbTrait = "Forelimbs";
    } else if (traitArray[2] == "hindlimbs") {
        hindlimbTrait = "Hindlimbs";
    } else if (traitArray[2] == "allLimb") {
        forelimbTrait = "Forelimbs";
        hindlimbTrait = "Hindlimbs";
    }
    traitArray.splice(2, 1, forelimbTrait, hindlimbTrait);
    return traitArray;
};

var pTime


function handleCase1(actions) {
    var startTime;
    var startDrake = new BioLogica.Organism(BioLogica.Species.Drake);
    var inChallenge = false;
    myAlleleChanges = [];
    myGenderChanges = [];
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        pTime = action.prettyTime;

        if (action.event == "Moved to") {
            inChallenge = false; // if we're in the challenge we must be moving away
            //If we're not in the challenge the "Started challenge" event will set
            //this true when the time comes.
            myAlleleChanges = [];
            myGenderChanges = [];
            var destination = action.parameters["title"];
            if (destination.match(/Case\s[1-9]:/)) {
                document.getElementById("demo").innerHTML += pTime + ": Moved to " + destination + "<br>"
            }
        }

        if (action.event == "Started challenge") {
            startTime = action.time
            if (action.parameters["case"] == 1) {
                inChallenge = true;
                firstTime = true;
                document.getElementById("demo").innerHTML += pTime + ": Started case " +
                    action.parameters["case"] + ", challenge " + action.parameters["challenge"] - 1 + "<br>";
            }
        }

        if (action.event == "Changed allele" && inChallenge) {
            if (firstTime) {
                startDrake.alleles = action.parameters["newAlleles"];
                var oldOrg = new BioLogica.Organism(BioLogica.Species.Drake, action.parameters["oldAlleles"]);
                var newOrg = new BioLogica.Organism(BioLogica.Species.Drake, action.parameters["newAlleles"]);
                firstTime = false;
            } else {
                //          console.log(pTime + ": changing alleles");
                oldOrg.alleles = action.parameters["oldAlleles"];
                newOrg.alleles = action.parameters["newAlleles"];
                var gChg = genderChange(oldOrg, newOrg);
                var aChg = alleleChange(oldOrg, newOrg);
                if (gChg) {
                    myGenderChanges.push(gChg);
                } else if (aChg) {
                    myAlleleChanges.push(aChg);
                }
            }
        }

        if (action.event == "Drake submitted" && inChallenge) {
            var msg
            var startAlleles = startDrake.alleles
            var goalURL = action.parameters["correctImage"];
            var subURL = action.parameters["submittedImage"];
            var goalsex = getSexFromImage(goalURL);
            var subsex = getSexFromImage(subURL);
            var goalTraits = getTraitsFromImage(goalURL);
            var subTraits = getTraitsFromImage(subURL);
            var sexMsg = (goalsex = "f") ? "female" : "male";
            document.getElementById("demo").innerHTML += "<br><b>Goal drake traits:</b> " + goalTraits +
                ", sex = " + goalsex;
            document.getElementById("demo").innerHTML += "<br><b>Start drake alleles:</b> " + startAlleles + "<br><br>";
            for (var j = 0; j < myGenderChanges.length; j++) {
                myGenderChanges[j].score = scoreGenderChange(myGenderChanges[j], goalURL);
                document.getElementById("demo").innerHTML += myGenderChanges[j].time + ": gender change from " +
                    myGenderChanges[j].oldsex + " to " + myGenderChanges[j].newsex + ", score = " +
                    myGenderChanges[j].score + "<br>"
            }
            for (var k = 0; k < myAlleleChanges.length; k++) {
                myAlleleChanges[k].score = scoreAlleleChange(myAlleleChanges[k], goalTraits);
                document.getElementById("demo").innerHTML += myAlleleChanges[k].time +
                    ": allele change. Gene = " +
                    myAlleleChanges[k].gene + ", type = " +
                    myAlleleChanges[k].type + ", score = " +
                    myAlleleChanges[k].score + "<br>"
            }

            document.getElementById("demo").innerHTML += "Total gender changes = " + myGenderChanges.length +
                ", total allele changes = " + myAlleleChanges.length + "<br>";
            document.getElementById("demo").innerHTML += pTime + ": " + sexMsg + " Drake submitted with " + subTraits + ": ";
            myGenderChanges = [];
            myAlleleChanges = [];
        }

        if (action.event == "Drakes revealed" && inChallenge) {
            document.getElementById("demo").innerHTML += (action.parameters["success"] ? "<b>match successful</b><br>" : "<b>match failed</b><br>");
        }


        if (action.event == "Completed challenge" && inChallenge) {
            firstTime = true;
            inChallenge = false;
            document.getElementById("demo").innerHTML += pTime + "<b>: Completed challenge</b>, stars awarded: " +
                action.parameters["starsAwarded"] + "<br><br>";
        }
    }
}

function genderChange(oldOrg, newOrg) { //returns a genderChange with old gender and new gender. If no gender change returns null.
    var gChange = {};
    if (oldOrg.alleles.length > newOrg.alleles.length) {
        gChange.oldsex = "f";
        gChange.newsex = "m";
        gChange.time = pTime;
        return gChange;
    } else if (oldOrg.alleles.length < newOrg.alleles.length) {
        gChange.oldsex = "m";
        gChange.newsex = "f";
        gChange.time = pTime;
        return gChange;
    } else {
        return null;
    }
}

function alleleChange(oldOrg, newOrg) { //returns null if no allele change, otherwise returns an allele change object.
    //Assumes that oldOrg and newOrg have the same sex
    //change objects have the following properties:
    //change.time  The pretty time when the change was made
    //change.side  The side on which the allele change took place
    //change.gene The name of the gene affected
    //change.type  "DH", "HD", "HR", "RH"

    var oldAlleleStringArray = oldOrg.alleles.split(","); //split string to get an array
    var newAlleleStringArray = newOrg.alleles.split(","); //each element starts with a: or b:
    var numberOfChanges = 0;
    var changedAllele;
    var pairedAllele = "";
    var side = "";
    for (var i = 0; i < oldAlleleStringArray.length - 1; i++) {
        if (oldAlleleStringArray[i] != newAlleleStringArray[i]) {
            numberOfChanges++;
            changedAllele = oldAlleleStringArray[i].replace(/^[a|b]:/, ""); // strip the a: or b: to get the allele
            side = oldAlleleStringArray[i].charAt(0); //first char is designates which side was changed
            if (side == "a") { //if the left-hand chromosome was changed then
                pairedAllele = oldAlleleStringArray[i + 1].replace(/^[a|b]:/, ""); //the paired allele is the next element
            } else { //otherwise
                pairedAllele = oldAlleleStringArray[i - 1].replace(/^[a|b]:/, ""); //it's the previous element
            }
        }
    }
    if (numberOfChanges != 1) {
        //      console.log(numberOfChanges + " alleles changed at time " + pTime);
        return null //should throw an error (once I figure out how!)
    }
    var myAlleleChange = {}; //create a new change object
    myAlleleChange.time = pTime;
    myAlleleChange.side = side;
    myAlleleChange.gene = BioLogica.Genetics.getGeneOfAllele(oldOrg.species, changedAllele).name;

    //Determine the change type by examining the starting change allele and its pairedAllele
    //If allele changed from d to r the change is either DH or HR
    //If it changed from r to d the change is either HD or RH
    if (alleleDominant(changedAllele) && alleleDominant(pairedAllele)) {
        myAlleleChange.type = "DH";
    } else if (alleleDominant(changedAllele) && !alleleDominant(pairedAllele)) {
        myAlleleChange.type = "HR";
    } else if (!alleleDominant(changedAllele) && alleleDominant(pairedAllele)) {
        myAlleleChange.type = "HD";
    } else {
        myAlleleChange.type = "RH";
    }
    return myAlleleChange;
}


function alleleDominant(allele) { //tests the first character of the allele string to see if it's upper case
    if (allele.charCodeAt(0) > 64 && allele.charCodeAt(0) < 91) {
        return true;
    } else if (allele.charCodeAt(0) > 95 && allele.charCodeAt(0) < 123) {
        return false;
    } else { //should throw an error
    }
}

function scoreGenderChange(gChg, goalURL) { // Called on a gender change object. Sets
    //the score of the object to 1 if its new gender matches the goal,
    //otherwise score = -1
    var goalsex = getSexFromImage(goalURL);
    //    console.log("time = " + pTime + "in scoreGenderChange, newsex = " + gChg.newsex + ", goalsex = " + goalsex);
    return (gChg.newsex == goalsex ? gChg.score = 1 : gChg.score = -1);
}

function scoreAlleleChange(aChg, goalTraits) { // returns 1 if allele change moves closer to relevant goal trait
    // returns 0 if allele change goes between dominant and heterozygous with dominant goal trait
    // returns -1 if allele change moves away from goal trait
    var gene = aChg.gene;
    var type = aChg.type;
    var score = "n/a";
    if (goalDominant(gene, goalTraits)) {
        if (type == "DH") { //wasted move
            score = 0
                //        console.log(pTime + ": allele change dom -> het on gene " + gene + ", goal is dominant. " + goalTraits);
        } else if (type == "HR") { //bad move – from a dominant phenotype to a recessive one
            score = -1
                //          console.log(pTime + ": allele change het -> rec on gene " + gene + ", goal is dominant. " + goalTraits);
        } else if (type == "HD") { //wasted move
            score = 0
                //        console.log(pTime + ": allele change het -> dom on gene " + gene + ", goal is dominant. " + goalTraits);
        } else if (type == "RH") { //good move – from a recessive phenotype to a dominant one
            score = 1
                //        console.log(pTime + ": allele change rec -> het on gene " + gene + ", goal is dominant. " + goalTraits);
        }
    } else { //goal dragon is recessive on the trait controlled by gene
        if (type == "DH") { //good – moving toward a recessive
            score = 1
                //        console.log(pTime + ": allele change dom -> het on gene " + gene + ", goal is recessive. " + goalTraits);
        } else if (type == "HR") { //good – creating recessive phenotype
            score = 1
                //        console.log(pTime + ": allele change het -> rec on gene " + gene + ", goal is recessive. " + goalTraits);
        } else if (type == "HD") { //bad: moving away from recessive
            score = -1
                //        console.log(pTime + ": allele change het -> dom on gene " + gene + ", goal is recessive. " + goalTraits);
        } else if (type == "RH") { //bad – creating dominant phenotype
            score = -1
                //        console.log(pTime + ": allele change rec -> het on gene " + gene + ", goal is recessive. " + goalTraits);
        }
    }
    return score;
}

function goalDominant(gene, traitArray) { // Takes a gene (e.g., "wings") and returns
    // true if the image has the dominant version of the characteristics (e.g., "has wings")
    var returnValue = "n/a";
    switch (gene) {
        case "metallic":
            (traitArray[0] == "Steel" ? returnValue = true : returnValue = false);
            break;
        case "wings":
            (traitArray[1] == "Wings" ? returnValue = true : returnValue = false);
            break;
        case "forelimbs":
            (traitArray[2] == "Forelimbs" ? returnValue = true : returnValue = false);
            break;
        case "hindlimbs":
            (traitArray[2] == "Hindlimbs" ? returnValue = true : returnValue = false);
            break;
        default:
            console.log("no match for gene " + gene + ", traitArray = " + traitArray);
    }
    return returnValue;
}

function getSexFromImage(URL) {
    var URLArray = URL.split("/");
    var traitArray = URLArray[URLArray.length - 1];
    return traitArray.split("_")[1];
}
