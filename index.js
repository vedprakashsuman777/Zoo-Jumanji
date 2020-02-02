  /* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

// IMPORTANT: Please note that this template uses Dispay Directives,
// Display Interface for your skill should be enabled through the Amazon developer console
// See this screenshot - https://alexa.design/enabledisplay

const Alexa = require('ask-sdk-core');

/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(welcomeMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};

const QuizHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log("Inside QuizHandler");
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
           (request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    console.log("Inside QuizHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;
    attributes.state = states.QUIZ;
    attributes.counter = 0;
    attributes.life= 3;
    attributes.quizScore = 0;

    var question = askQuestion(handlerInput);
    var speakOutput = startQuizMessage + question;
    var repromptOutput = question;

    const item = attributes.quizItem;
    const property = attributes.quizProperty;

    if (supportsDisplay(handlerInput)) {
      const title = `Question #${attributes.counter}`;
      const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getQuestionWithoutOrdinal(property, item)).getTextContent();
      const backgroundImage = new Alexa.ImageHelper().addImageInstance(getBackgroundImage(attributes.quizItem.Abbreviation)).getImage();
      const itemList = [];
      getAndShuffleMultipleChoiceAnswers(attributes.selectedItemIndex, item, property).forEach((x, i) => {
        itemList.push(
          {
            "token" : x,
            "textContent" : new Alexa.PlainTextContentHelper().withPrimaryText(x).getTextContent(),
          }
        );
      });
      response.addRenderTemplateDirective({
        type : 'ListTemplate1',
        token : 'Question',
        backButton : 'hidden',
        backgroundImage,
        title,
        listItems : itemList,
      });
    }

    return response.speak(speakOutput)
                   .reprompt(repromptOutput)
                   .getResponse();
  },
};
/*
const DefinitionHandler = {
  canHandle(handlerInput) {
    console.log("Inside DefinitionHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state !== states.QUIZ &&
           request.type === 'IntentRequest' &&
           request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {
    console.log("Inside DefinitionHandler - handle");
    //GRABBING ALL SLOT VALUES AND RETURNING THE MATCHING DATA OBJECT.
    const item = getItem(handlerInput.requestEnvelope.request.intent.slots);
    const response = handlerInput.responseBuilder;

    //IF THE DATA WAS FOUND
    if (item && item[Object.getOwnPropertyNames(data[0])[0]] !== undefined) {
      if (useCardsFlag) {
        response.withStandardCard(
          getCardTitle(item),
          getTextDescription(item),
          getSmallImage(item),
          getLargeImage(item));
      }

      if(supportsDisplay(handlerInput)) {
        const image = new Alexa.ImageHelper().addImageInstance(getLargeImage(item)).getImage();
        const title = getCardTitle(item);
        const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getTextDescription(item, "<br/>")).getTextContent();
        response.addRenderTemplateDirective({
          type: 'BodyTemplate2',
          backButton: 'visible',
          image,
          title,
          textContent: primaryText,
        });
      }
      return response.speak(getSpeechDescription(item))
              .reprompt(repromptSpeech)
              .getResponse();
    }
    //IF THE DATA WAS NOT FOUND
    else
    {
      return response.speak(getBadAnswer(item))
              .reprompt(getBadAnswer(item))
              .getResponse();
    }
  }
};
*/
const QuizAnswerHandler = {
  canHandle(handlerInput) {
    console.log("Inside QuizAnswerHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state === states.QUIZ &&
           request.type === 'IntentRequest' &&
           request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {
    console.log("Inside QuizAnswerHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;

    var speakOutput = ``;
    var repromptOutput = ``;
    const item = attributes.quizItem;
    const property = attributes.quizProperty;
    const isCorrect = compareSlots(handlerInput.requestEnvelope.request.intent.slots, item[property]);

    if (isCorrect) {
      speakOutput = getSpeechCon(true);
      speakOutput += getTrueAnswer(property, item);
      attributes.quizScore += 1;
      handlerInput.attributesManager.setSessionAttributes(attributes);
    } else {
      speakOutput = getSpeechCon(false);
      speakOutput += getWrongAnswer(property, item);
       attributes.life -= 1;
    }
//----------------------------------------------------------------------------------------------------------------------------------------------
   
    var question = ``;
    //IF YOUR QUESTION COUNT IS LESS THAN 10, and life is less than  3 WE NEED TO ASK ANOTHER QUESTION.
    if (attributes.counter < 10 && attributes.life>0) {
      speakOutput += getCurrentScore(attributes.quizScore, attributes.counter ,attributes.life);
      question = askQuestion(handlerInput);
      speakOutput += question;
      repromptOutput = question;

      if (supportsDisplay(handlerInput)) {
        const title = `Question #${attributes.counter}`;
        const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getQuestionWithoutOrdinal(attributes.quizProperty, attributes.quizItem)).getTextContent();
        const backgroundImage = new Alexa.ImageHelper().addImageInstance(getBackgroundImage(attributes.quizItem.Abbreviation)).getImage();
        const itemList = [];
        getAndShuffleMultipleChoiceAnswers(attributes.selectedItemIndex, attributes.quizItem, attributes.quizProperty).forEach((x, i) => {
          itemList.push(
            {
              "token" : x,
              "textContent" : new Alexa.PlainTextContentHelper().withPrimaryText(x).getTextContent(),
            }
          );
        });
        response.addRenderTemplateDirective({
          type : 'ListTemplate1',
          token : 'Question',
          backButton : 'hidden',
          backgroundImage,
          title,
          listItems : itemList,
        });
      }
      return response.speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
    }
    else {
      if(attributes.life == 0)
      {  speakOutput +=getLostGame() + exitSkillMessage; }
      else
          { speakOutput += getFinalScore(attributes.quizScore, attributes.counter) + getRewardText() + exitSkillMessage;}
      if(supportsDisplay(handlerInput)) {
        const title = 'Thank you for playing';
        const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getFinalScore(attributes.quizScore, attributes.counter)).getTextContent();
        response.addRenderTemplateDirective({
          type : 'BodyTemplate1',
          backButton: 'hidden',
          title,
          textContent: primaryText,
        });
      }
      return response.speak(speakOutput).getResponse();
    }
  },
};

 const RepeatHandler = {
  canHandle(handlerInput) {
    console.log("Inside RepeatHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state === states.QUIZ &&
           request.type === 'IntentRequest' &&
           request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    console.log("Inside RepeatHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const question = getQuestion(attributes.counter, attributes.quizproperty, attributes.quizitem);

    return handlerInput.responseBuilder
      .speak(question)
      .reprompt(question)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    console.log("Inside HelpHandler");
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
           request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    console.log("Inside HelpHandler - handle");
    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    console.log("Inside ExitHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return request.type === `IntentRequest` && (
              request.intent.name === 'AMAZON.StopIntent' ||
              request.intent.name === 'AMAZON.PauseIntent' ||
              request.intent.name === 'AMAZON.CancelIntent'
           );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(exitSkillMessage)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    console.log("Inside ErrorHandler");
    return true;
  },
  handle(handlerInput, error) {
    console.log("Inside ErrorHandler - handle");
    console.log(`Error handled: ${JSON.stringify(error)}`);
    console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};


/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
const imagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png";
const backgroundImagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png";
const speechConsCorrect = [ 'Bravo',  'Cheers', 'Hurray', 'Oh dear. Just kidding.  Hurray','Well done', 'Woo hoo', 'Yay','aww yeah','excellent','good','great','well','woo hoo'];
const speechConsWrong = ['Argh', 'ugh','uh oh', 'Eek',  'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Shucks','oops','jeez',''];

const data = [
 

 // {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/zapsplat_animals_lion_roar_growl_002_19911.mp3" />', Abbreviation: 'WY', Animal: 'Cheyenne', StatehoodYear: 1890, StatehoodOrder: 44},
 {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/Jaguar3.mp3" />', Animal: 'Jaguar'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/LotsOfBats.mp3" />', Animal: 'Bat'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/Nightingale.mp3" />', Animal: 'Nightingale'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/Tiger7.mp3" />', Animal: 'Tiger'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/bearsound.mp3" />', Animal: 'Bear'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/camel6.mp3" />', Animal: 'Camel'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/duck.mp3" />', Animal: 'Duck'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/elephant8.mp3" />', Animal: 'Elephant'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/finch.mp3" />', Animal: 'Finch'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/hawk.mp3" />', Animal: 'Hawk'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/hippo4.mp3" />', Animal: 'Hippo'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/hyena3.mp3" />', Animal: 'Hyena'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/kangaroo.mp3" />', Animal: 'Kangaroo'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/leopard7.mp3" />', Animal: 'Leopard'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/lion.mp3" />', Animal: 'Lion'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/panther5.mp3" />', Animal: 'Panther'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/peacock.mp3" />', Animal: 'Peacock'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/woodpecker.mp3" />', Animal: 'Woodpecker'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/Cheetah6.mp3" />', Animal: 'Cheetah'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/Chimpanzee.mp3" />', Animal: 'Chimpanzee'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/aligator.mp3" />', Animal: 'Aligator'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/ape.mp3" />', Animal: 'Ape'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/baboon1.mp3" />', Animal: 'Baboon'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/capuchin.mp3" />', Animal: 'Capuchin'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/Gorilla.mp3" />', Animal: 'Gorilla'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/Vulture.mp3" />', Animal: 'Vulture'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/horse.mp3" />', Animal: 'Horse'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/koala%5B1%5D.mp3" />', Animal: 'Koala'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/mocking+bird.mp3" />', Animal: 'Mockingbird'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/owl.mp3" />', Animal: 'Owl'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/panda.mp3" />', Animal: 'Panda'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/polarbear.mp3" />', Animal: 'Polarbear'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/raccoon3.mp3" />', Animal: 'Raccoon'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/wolf6.mp3" />', Animal: 'Wolf'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/zebra5.mp3" />', Animal: 'Zebra'},
  {StateName: ' <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/cougar.mp3" />', Animal: 'Cougar'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/macaw.mp3" />', Animal: 'Macaw'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/eagle.mp3" />', Animal: 'Eagle'},
  {StateName: ' <audio src="https://skill-sound-libraries.s3.us-east-2.amazonaws.com/rhinos1.mp3" />', Animal: 'Rhino'},

 
   
];

const states = {
  START: `_START`,
  QUIZ: `_QUIZ`,
};

const welcomeMessage = ` <audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/door_open.mp3" /><amazon:emotion name="excited" intensity="high">    
<prosody volume="x-loud"><s> Welcome to the Zoo Jumanji !</s></prosody>
</amazon:emotion> <break time="1s"/> 
<p> here you can find ,<amazon:emotion name="excited" intensity="medium"> various wild animals and  birds </amazon:emotion>,<prosody rate="110%">,  So  without wasting your time,</prosody><amazon:emotion name="excited" intensity="medium">  start exploring the  world of animals </amazon:emotion>,  </p> 
you just need to say,<amazon:emotion name="excited" intensity="high">   explore the zoo!!</amazon:emotion>
`;
const startQuizMessage = `  <amazon:emotion name="excited" intensity="medium"> Cool !! You are in the zoo </amazon:emotion><break time="0.5s"/> <amazon:effect name="whispered">Sshhhh <break time="1s"/> wait a second,  Something went wrong</amazon:effect><break time="1s"/>
  <audio src="soundbank://soundlibrary/animals/dinosaurs/dinosaurs_06"/><audio src="soundbank://soundlibrary/animals/dinosaurs/dinosaurs_04"/>
 <amazon:emotion name="excited" intensity="high"> Oh my god  !! </amazon:emotion>,  <amazon:emotion name="excited" intensity="high"><prosody volume="x-loud"><prosody rate="medium">a big Dinosaur starts haunting our zoo animals.</prosody></prosody></amazon:emotion><break time="0.5s"/>
<amazon:emotion name="excited" intensity="medium"><prosody rate="medium"><prosody volume="loud">It's time to be a saviour for our zoo</prosody></prosody></amazon:emotion>.
<amazon:emotion name="disappointed" intensity="high"><prosody rate="x-slow"> You are the only hope</prosody></amazon:emotion><break time="1s"/>  <amazon:emotion name="excited" intensity="medium"><prosody rate="medium">you can save them by recognize the animals by thier voice</prosody></amazon:emotion>. 
<amazon:emotion name="excited" intensity="high"><prosody volume="x-loud"><prosody rate="medium">So !! what are you waiting for , Let's get started</prosody></prosody></amazon:emotion>. <break time="1s"/><audio src="https://zoo-audio-list.s3.us-east-2.amazonaws.com/quiz+_start.mp3" /><break time="3s"/>
 `;
const exitSkillMessage = `<break time="2s"/>Thank you for playing the Zoo Saviour!`;
const repromptSpeech = `Let's save another animal`;
const helpMessage = `you just say "Explore the zoo" to start exploring the animals.<break time="1s"/>
                      you got asked 10 question .In each question you need to listen the animal sound carefully , and after that ,  you need to answer the animal name , to protect them from Dinosaur<break time="1s"/>
                      each question will be asked after a beep sound, so listen text and sound carefully after the beep
                      you have only 3 lifelines to save the animals , means you are not allowed to play more after giving 3 wrong answers.<break time="1s"/>
                      you can quit the game anytime by saying "Exit".<break time="1s"/>
                      you can continue your adventure. `;
const useCardsFlag = true;

/* HELPER FUNCTIONS */

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
  return hasDisplay;
}
/*
function getBadAnswer(item,property) {
  return `Sorry !! we lost our  animal ${item[property]} ${helpMessage}`;
}
*/
function getCurrentScore(score, counter,life) {
  return `<break time="1.5s"/><amazon:emotion name="excited" intensity="high"> ${score} out of ${counter} animals rescued and you have just ${life} more life left to rescue the zoo.</amazon:emotion>`;
}

function getFinalScore(score, counter) {
  return `<break time="1s"/>Congratulation !! You saved ${score} out of ${counter} animals`;
}

function getRewardText(){
  return`<break time="1s"/> <amazon:emotion name="excited" intensity="high">we knew that!!,  you are the one!! , Thank you for saving our zoo</amazon:emotion>`;
}

function getLostGame() {
  return `<amazon:emotion name="disappointed" intensity="high">Ohh god !!, you lose our hope <break time="1s"/> the zoo is no more.</amazon:emotion>`;
}

function getCardTitle(item) {
  return item.StateName;
}

function getSmallImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/720x400/${item.Abbreviation}._TTH_.png`;
}

function getLargeImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/1200x800/${item.Abbreviation}._TTH_.png`;
}

function getImage(height, width, label) {
  return imagePath.replace("{0}", height)
    .replace("{1}", width)
    .replace("{2}", label);
}

function getBackgroundImage(label, height = 1024, width = 600) {
  return backgroundImagePath.replace("{0}", height)
    .replace("{1}", width)
    .replace("{2}", label);
}

/*function getSpeechDescription(item) {
  
  //the Alexa Service will present the correct ordinal (i.e. first, tenth, fifteenth) when the audio response is being delivered
  return `${item.StateName} is the ${item.StatehoodOrder}th state, admitted to the Union in ${item.StatehoodYear}.  The Animal of ${item.StateName} is ${item.Animal}, and the abbreviation for ${item.StateName} is <break strength='strong'/><say-as interpret-as='spell-out'>${item.Abbreviation}</say-as>.  I've added ${item.StateName} to your Alexa app.  Which other state or Animal would you like to know about?`;
}*/

function formatCasing(key) {
  return key.split(/(?=[A-Z])/).join(' ');
}

function getQuestion(counter, property, item) {
  const qnstatement=[`Omg!! Dinosaur ${item.StateName} can you please help me out`,
  `So scary  ${item.StateName} Please help me`,
  `Hey  ${item.StateName} help me to escape from Dinosaur`,
  `${item.StateName} Help !! Help !! Help !!  It's a Dinosaur`,
  `Omg !!It's a Dinosaur, ${item.StateName}  help me!! help me!!`,
  `Mummmaa !!  ${item.StateName} A big Dinosaur, help!! help!!`,
  `It's me  ${item.StateName} Please tell my name to save me`,
  `Hey  ${item.StateName} Please save me from the Dinosaur`,
  `Ahhh  ${item.StateName} I think am under the trap of Dinosaur please help`,
  ` ${item.StateName} I wanna live more, Please save me from Dinosaur`,
  ` ${item.StateName} Oops!! Dinosaur!!  Help !!help!!`,
  ` ${item.StateName} Woooh Dinosaur!! i think it's my last day`,
  ` ${item.StateName} Dinosaur!! Dinosaur !!run !!run!!`,
  `Mummy  ${item.StateName} help !!help`,
  `Run !!run!!  ${item.StateName} Dinosaur is here`,
  `guess me  ${item.StateName} before the Dinosaur come`,
  `${item.StateName} Speak up !!Speak up my name before Dinosaur reaches me`,
  `Call me!! Call me!!  ${item.StateName} before Dinosaur eats me`,
  `Dangerous Dinosaur  ${item.StateName} Help`,
  `Godzilla is here ${item.StateName} save me ,please`,
  `Save me!! Save me!!  ${item.StateName} from Dinosaur`,
  `Help me!! help me!!  ${item.StateName} Save me!! save me`,
  `Kindly guess who am i  ${item.StateName} before Dinosaur catches me`,
  `Help me !!help me!!  ${item.StateName} before Dinosaur catches me`, 
  `I know you will save me  ${item.StateName} from Dinosaur`,
  `Hey warrior guess me ${item.StateName} you are  my last hope`,
  `${item.StateName} it's my birthday !! i don't want to die today`];
  //return `Here is your ${counter}th question.${qnstatement[getRandom(0,qnstatement.length-1)]}`;
  
  //the Alexa Service will present the correct ordinal (i.e. first, tenth, fifteenth) when the audio response is being delivered
  return `<break time="1s"/><audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01"/><break time="1s"/><amazon:emotion name="excited" intensity="high">  ${qnstatement[getRandom(0,qnstatement.length-1)]}</amazon:emotion>`;
}

// getQuestionWithoutOrdinal returns the question without the ordinal and is
// used for the echo show.
/*function getQuestionWithoutOrdinal(property, item) {
  return "What is the " + formatCasing(property).toLowerCase() + " of "  + item.StateName + "?";
}*/

function getTrueAnswer(property, item) {
  const trueansstatement=[`you save the  ${item[property]} from the Dinosaur`,
  ` !!${item[property]} got a new life`,
  ` ${item[property]} is finally rescued`,
  `warrior !!you save our little  ${item[property]} `,
  `finally  ${item[property]} is in safe hand `,
  `we know you can save  ${item[property]}`,
  `thank you for saving  ${item[property]} from the Dinosaur`];
  switch (property) {
    case 'Abbreviation':
      return `The ${formatCasing(property)} is <say-as interpret-as='spell-out'>${item[property]}</say-as>. `;
    default:
      return `<amazon:emotion name="excited" intensity="high">${trueansstatement[getRandom(0,trueansstatement.length-1)]} </amazon:emotion>`;
  }
}
function getWrongAnswer(property,item){
  const wrongansstatement=[`sorry to say you !! that  ${item[property]} is no more`,
  `  you lose our ${item[property]} `,
  `you can not save ${item[property]}`,
  `Dinosaur ate our little ${item[property]}`,
  `we can not believe !! we lose our ${item[property]} `,
  `we do not expect to lose our little ${item[property]}`];
   return `<amazon:emotion name="disappointed" intensity="high">${wrongansstatement[getRandom(0,wrongansstatement.length-1)]}</amazon:emotion> `;
}

function getRandom(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function askQuestion(handlerInput) {
  console.log("I am in askQuestion()");
  //GENERATING THE RANDOM QUESTION FROM DATA
  const random = getRandom(0, data.length - 1);
  const item = data[random];
  const propertyArray = Object.getOwnPropertyNames(item);
  const property = propertyArray[getRandom(1, propertyArray.length - 1)];

  //GET SESSION ATTRIBUTES
  const attributes = handlerInput.attributesManager.getSessionAttributes();

  //SET QUESTION DATA TO ATTRIBUTES
  attributes.selectedItemIndex = random;
  attributes.quizItem = item;
  attributes.quizProperty = property;
  attributes.counter += 1;

  //SAVE ATTRIBUTES
  handlerInput.attributesManager.setSessionAttributes(attributes);

  const question = getQuestion(attributes.counter, property, item);
  return question;
  
 
}


function compareSlots(slots, value) {
  for (const slot in slots) {
    if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
      if (slots[slot].value.toString().toLowerCase() === value.toString().toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

function getItem(slots) {
  const propertyArray = Object.getOwnPropertyNames(data[0]);
  let slotValue;

  for (const slot in slots) {
    if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
      slotValue = slots[slot].value;
      for (const property in propertyArray) {
        if (Object.prototype.hasOwnProperty.call(propertyArray, property)) {
          const item = data.filter(x => x[propertyArray[property]]
            .toString().toLowerCase() === slots[slot].value.toString().toLowerCase());
          if (item.length > 0) {
            return item[0];
          }
        }
      }
    }
  }
  return slotValue;
}

function getSpeechCon(type) {
  if (type) return `<say-as interpret-as='interjection'>${speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]}! </say-as><break strength='strong'/>`;
  return `<say-as interpret-as='interjection'>${speechConsWrong[getRandom(0, speechConsWrong.length - 1)]} </say-as><break strength='strong'/>`;
  
  
}


function getTextDescription(item) {
  let text = '';

  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      text += `${formatCasing(key)}: ${item[key]}\n`;
    }
  }
  return text;
}

function getAndShuffleMultipleChoiceAnswers(currentIndex, item, property) {
  return shuffle(getMultipleChoiceAnswers(currentIndex, item, property));
}

// This function randomly chooses 3 answers 2 incorrect and 1 correct answer to
// display on the screen using the ListTemplate. It ensures that the list is unique.
function getMultipleChoiceAnswers(currentIndex, item, property) {

  // insert the correct answer first
  let answerList = [item[property]];

  // There's a possibility that we might get duplicate answers
  // 8 states were founded in 1788
  // 4 states were founded in 1889
  // 3 states were founded in 1787
  // to prevent duplicates we need avoid index collisions and take a sample of
  // 8 + 4 + 1 = 13 answers (it's not 8+4+3 because later we take the unique
  // we only need the minimum.)
  let count = 0;
  let upperBound = 12;

  let seen = new Array();
  seen[currentIndex] = 1;

  while (count < upperBound) {
    let random = getRandom(0, data.length - 1);

    // only add if we haven't seen this index
    if ( seen[random] === undefined ) {
      answerList.push(data[random][property]);
      count++;
    }
  }

  // remove duplicates from the list.
  answerList = answerList.filter((v, i, a) => a.indexOf(v) === i);
  // take the first three items from the list.
  answerList = answerList.slice(0, 3);
  return answerList;
}

// This function takes the contents of an array and randomly shuffles it.
function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while ( 0 !== currentIndex ) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    QuizHandler,
   // DefinitionHandler,
    QuizAnswerHandler,
    RepeatHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();