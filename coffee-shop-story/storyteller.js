var createStoryTeller = function (spec, my) {
    'use strict';
    /*jslint browser:true*/
        
    // object encapsulating protected members
    my = my || {};

    // protected members
    my.characters = spec.characters;
    
    my.toParagraphStyle = function (story) {
        if (typeof story === "string") {
            return "<p>" + story + "</p>";
        } else if (Object.prototype.toString.call(story) === "[object Array]") {
            return "<p>" + story.join("</p><p>") + "</p>";
        } else {
            throw "wtf is this story";
        }
    };

    my.replaceReferences = function (story) {
        return story.replace(/@[A-Za-z]+/g, function (match) {
            var refname = match.substring(1, match.length);
            
            if (my.characters[refname]) {
                if (my.characters[refname].known) {
                    return '<strong><a id="' + refname + '" href="#">' + my.characters[refname].name + '</a></strong>';
                } else {
                    return my.characters[refname].alias;
                }
            } else {
                return match;
            }
        });
    };

    my.noteAndReplaceDiscoveries = function (story) {
        return story.replace(/%[A-Za-z]+/g, function (match) {
            var refname = match.substring(1, match.length);
            
            if (my.characters[refname]) {
                my.characters[refname].known = true;
                return my.characters[refname].name;
            } else {
                return match;
            }
        });
    };
    
    // object to return
    var that,

    // private members
        defaultCharacter = spec.defaultCharacter,
        storyElementID = spec.storyElementID,
        restartText = "<strong><em>The scene fades, the curtain falls, and the credits roll.</em></strong>",
        timeCount = -1,
        curCharacter = defaultCharacter,
        totalTimeSteps = my.characters[defaultCharacter].stories.length,

        reset = function () {
            timeCount = -1;
            curCharacter = defaultCharacter;
        },
        
        step = function () {}, // placeholder
        
        setLink = function (name) {
            document.getElementById(name).onclick = function () {
                curCharacter = name;
                step();
            };
        },
        
        resetLinkCallbacks = function () {
            var name;
            for (name in my.characters) {
                if (my.characters.hasOwnProperty(name)) {
                    try {
                        setLink(name);
                    } catch (e) {}
                }
            }
        };

    step = function () {
        if (timeCount === totalTimeSteps) {
            reset();
        }
        
        timeCount += 1;
        
        
        document.getElementById("character").innerHTML = curCharacter + ": " + my.characters[curCharacter].alias;
        
        if (timeCount === totalTimeSteps) {
            document.getElementById("story").innerHTML = restartText;
            document.getElementById("next").innerHTML = "<strong>Begin again.</strong>";
        } else {
            var story = my.characters[curCharacter].stories[timeCount];
            document.getElementById("story").innerHTML = my.replaceReferences(my.noteAndReplaceDiscoveries(my.toParagraphStyle(story)));
            document.getElementById("next").innerHTML = "Continue...";
        }
        
        resetLinkCallbacks();
    };
    
    // construction
    document.getElementById(storyElementID).innerHTML = '<div id="character"></div><p id="story"></p><br/><a id="next" href="#"></a></strong>';
    document.getElementById("next").onclick = step;
    reset();
    step();

    return that;
};