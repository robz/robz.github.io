(function main() {
    'use strict';
    
    createStoryTeller({
        storyElementID: "storyframe",
        defaultCharacter: "David",
        characters: {
            David: {
                name: "David",
                alias: "some young man",
                known: false,
                stories: [
                    ["David holds the door open for @Angela, and then steps into the coffee shop.", "He immediately takes note of @Julia reading a book in a comfortable chair near the far wall."],

                    "Pretending to ignore her, he gets in line, takes out his phone, and checks his texts.",

                    ["David has received one text from @Steven, sent about a minute ago: <em>running late. be there in 5</em>.", "He hears someone ordering a chai latte with a triple shot of espresso. He steps forward in line, looking up briefly to see @Sara walking away from the counter.", "Watching the far wall out the corner of his eye, he replies to the text."],

                    "&#8220;Soy mocha for %Angela!&#8221; shouts @Monica.",

                    "David steps up to the counter ready to order, but he&#8217;s glued to his phone. He fires another couple texts to @Steven as he waits for @Monica come take his order.",

                    ["&#8220;What can I get you?&#8221; The barista startles David. He looks up, but only to glance at her name tag: <em>%Monica.</em>", "&#8220;Uh&#8212;I think I&#8217;ll just have a coffee, please,&#8221; he responds, and hands her a credit card. &#8220;And you can keep a tab open.&#8221;", "He turns, and to his surprise, finds @Julia standing behind him. She looks terrified. &#8220;You poisoned me with a book once,&#8221; she says coldly. &#8220;I&#8217;ll never forgive you for that.&#8221;", "He stares at her for a moment in silence. Then, for the first time in a very long time, he smiles."]
                ]
            },

            Julia: {
                name: "Julia",
                alias: "the girl",
                known: false,
                stories: [
                    "wat",
                    
                    "Julia looks up from her book, noticing @David walk into the coffee shop. She recongizes him, but can&#8217;t remember his name, nor remember where she met him. <em>Well, this is awkward.</em> She goes back to her book and tries very hard to ignore him.",
                    
                    ["For a moment, Julia concentrates on her book. She&#8217;s very near the end:", "&#8220;You cannot change to me, Dorian,&#8221; said Lord Henry. &#8220;You and I will always be friends.&#8221;", "&#8220;Yet you poisoned me with a book once,&#8221; Dorian replied. &#8220;I should not forgive that...&#8221;"],
                    
                    "&#8220;Soy mocha for %Angela!&#8221; shouts @Monica.",
                    
                    ["Julia looks over at the man by the counter, then quickly back at her book, avoiding the terrible chance of making eye contact. She then notices someone, a college student from the looks of all the textbooks on her table, talking in her sleep.", "Julia snaps the book closed. <em>That&#8217;s it, this is too weird. I have to go say something to him, whoever he is.</em>", "&#8220;Chai latte with a triple shot of espresso on the bar!!!&#8221; screams @Monica, out of breath."],
                    
                    ["Julia stands up bravely, and walks to the counter. His back facing her, she almost loses her nerve and goes back to her chair. He turns around and sees her just in time. She panics. Without thinking, she blurts out the passage that she had just been reading.", "He smiles. All of a sudden, she remembers everything."]
                ]
            },

            Angela: {
                name: "Angela",
                alias: "an elderly woman",
                known: false,
                stories: [
                    "wat",

                    ["Angela smiles at @David who held the door for her, but he isn&#8217;t paying any attention to her&#8212;he seems to be too distracted by @Julia sitting in the back of the cafe. Angela rolls her eyes and walks to the outdoor seating area.", "She passes a table where @Chadwick and @Sammy are playing chess. The man winks at her, sucking at a cigar. She shudders. <em>How dreadful!<em/>"],
                    
                    "Pinching her nose to avoid breathing in the smoke, Angela walks to her table under a large umbrella and sits down. She opens a newspaper to the &#8216;I-Saw-You&#8217; section, where anonymous people send in short descriptions of strangers that they see, but don&#8217;t properly meet. Angela absolutely adores this section. Something about knowing people&#8217;s private thoughts makes the world seem so much more interesting.",
                    
                    ["Angela hears @Monica call her name from inside the cafe. <em>That was fast!</em> Just before rising from her table she sees a particularly interesting I-Saw-You post, and pauses to read it:", "<div id=\"sara-note\">I was able to catch the 6 because you held the door. You looked beat, it appeared you were on your way home from work. I was standing against the door, you facing me wearing a nice brown coat. We both reached for the pole and our hands touched. We rode one stop to 42nd (my stop), as I was leaving I sneezed and even though you didn&#8217;t know me you blessed me and it was wonderful. I hope to find you. &#8212;%Sara</div>"],
                    
                    "<em>How lovely</em>, Angela thinks. <em>How... exquisite!</em> She stares off into space, thinking of youthfulness, and how there always seems to be a tragedy behind all beautiful things.",

                    "Still in a somewhat-sentimental state, Angela gets up from the table and begins walking back into the cafe to pick up her drink, pinching her nose. As she walks past the chess match, the old man is staring at the board in awe, his cigar almost falling from his hand. &#8220;That&#8217;s checkmate, Mr. Chadwick!&#8221; announces @Sammy sitting across from him."
                ]
            },
            
            Steven: {
                name: "Steven",
                alias: "a friend",
                known: false,
                stories: [
                    "wat",

                    "wat",

                    "wat",

                    ["Steven is sitting lethargically on the couch in his apartment. Work seems to take everything out of him these days. His phone vibrates, but he doesn&#8217;t notice it. His eyes droop. He&#8217;s supposed to go meet David. He should get up and drive to that coffee shop. He should...", "Steven suddenly remembers how comfortable the cushions on his couch are. He leans against them for a moment, and then immediately falls back asleep."],

                    ["It&#8217;s a very strange dream.", "Steven is in the coffee shop where he was supposed to meet David. In fact, David is right there! He&#8217;s standing in line about to order something. Steven&#8217;s gaze wanders, and he begins to notice something strange about the reflective surfaces around the shop. They... glimmer. He sees a flash of something on a fogged-up window pane.", "On impulse, he takes out his phone and tries to turn it on. It won&#8217;t start.", "Suddenly, a beautiful, vaguely familiar woman is peering up at him from the screen. She smiles and says something to him. Asks him a question.", "He responds assertively: &#8220;Hello. I&#8217;m Steven.&#8221;", "Then, as quickly as she had appeared, the woman was gone. Steven&#8217;s phone vibrates twice."],

                    ["Steven wakes up, clutching his phone. He had received three texts from David. He reads the first: <em>she&#8217;s here.</em>", "&#8220;Whoa,&#8221; he declares to his empty apartment, thinking in his drousy state that this must be some kind of sign. He gets up from the couch, grabs his coat, and rushes for the door, forgetting his phone. Whoever this person was, he had to find her.", "Of course, if Steven had looked at the other texts, he probably would have been knocked out of his sleepy, superstitious stupor. The second read: <em>%Julia, i mean. shes here. reading that book i lent her.</em>", "And the third: <em>steven i dont think she even remembers me</em>"]
                ]
            },
            
            Sara: {
                name: "Sara",
                alias: "a very sleep-deprived college student",
                known: false,
                stories: [
                    "wat",
                    
                    "wat",
                    
                    "wat",
                    
                    ["Sara walks back to her table noticing every minute detail around her, thinking of each as a novelity. As she sits down she wonders what she&#8217;ll be doing in 10 years, and then considers the state of the human race for a brief moment. She smiles for no reason at all, and then rests her head on the stack of textbooks crowding her table. She&#8217;ll just close her eyes for a second, only until her drink is ready...", "She falls asleep and begins to dream about the man from the train."],

                    ["It&#8217;s a very strange dream.", "Sara is in the coffee shop where she fell asleep, but her body is gone. For some odd reason, she can only see from the perspective of objects that have reflective surfaces. From the shiny cover of a paper-back Picture of Dorian Gray, she spots @David step up to the counter to order something. The foggy window to the outdoor seating area yields a view of an elderly woman staring off into space, deeply engrossed in her own mind. From a plastic chess piece, she watches @Sammy sneak a furtive look underneath the table.", "Then, as she swirls around a cup of water from the inside of an ice cube, she sees the man from the train. He&#8217;s sitting in the chair where she fell asleep, looking perplexed.", "As she watches him (upside-down, since she&#8217;s still inside the ice cube), he takes out his phone and stares at the dark screen. Apparently, it won&#8217;t turn on.", "She moves onto the surface of the phone and stares at him longingly. He jumps. He can see her!", "She smiles nervously up at him from his phone and says, &#8220;Hi!&#8221; He just gawks at her. &#8220;Um... my name is Sara! What&#8217;s yours?&#8221;", "There&#8217;s an awkward pause. Finally, he musters a response: &#8220;Uh. Hi. My name... uh I&#8217;m %Steven?&#8221;", "&#8220;Chai latte with a triple shot of espresso on the bar!!!&#8221; screams @Monica, out of breath."],
                    
                    ["Sara jumps awake, staring wildly around her. Slowly, she relaxes, and gets up to grab her drink. <em>No</em>, she thinks to herself as she takes the chai latte from the bar, <em>That couldn&#8217;t be his name. It was just a dream.</em>", "She sighs deeply and goes back to studying."]
                ]
            },
            
            Monica: {
                name: "Monica",
                alias: "one of the baristas",
                known: false,
                stories: [
                    "wat",

                    "wat",

                    "wat",
                    
                    "wat",
                    
                    "<em>Poor kids</em>, thinks Monica. <em>Always working so hard, for so little.</em> She whips up @Sara&#8217;s requested poison and then calls it out, returning to the counter to take the next customer&#8217;s order.",
                    
                    ["The next person to order is @David, fumbling with his phone.", "&#8220;What can I get you?&#8221;", "&#8220;Uh&#8212;I think I&#8217;ll just have a coffee, thanks&#8221; he responds, and hands her a credit card. &#8220;And you can keep a tab open.&#8221;", "As Monica takes the his card, she looks at his first name: %David. She writes it onto a piece of paper to keep track of his tab, then turns around to fill a cup of coffee for him."]
                ]
            },
            
            Chadwick: {
                name: "Chadwick",
                alias: "old man",
                known: false,
                stories: [
                    "wat",

                    "wat",

                    "Chadwick TODO 1",
                    
                    "Chadwick TODO 2",
                    
                    "Chadwick TODO 3",
                    
                    "Chadwick TODO 4"
                ]
            },
            
            Sammy: {
                name: "Sammy",
                alias: "a young boy",
                known: false,
                stories: [
                    "wat",

                    "wat",

                    "wat",
                    
                    "Sammy TODO 1",
                    
                    "Sammy TODO 2",
                    
                    "Sammy TODO 3"
                ]
            }
        }
    });
}());