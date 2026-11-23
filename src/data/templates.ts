import type { Sentence, Template, TemplateId } from './types';
import { SLOTS } from './fillers';

export const SENTENCES: Record<string, Sentence> = {
  // ===== L1 通用骨架（共用句去重，只建一张卡） =====
  'shared.salutation': {
    id: 'shared.salutation',
    layer: 'L1',
    role: 'heading',
    en: 'Dear {{salutation}},',
    zh: '尊敬的{{salutation}}：',
    cue: 'Dear',
    slots: ['salutation'],
  },
  'shared.emotion.pleasure': {
    id: 'shared.emotion.pleasure',
    layer: 'L1',
    role: 'emotion',
    en: 'It is a great pleasure for me to write this letter to you.',
    zh: '能给你写这封信，我感到十分高兴。',
    cue: 'It is a great pleasure',
    slots: [],
  },
  'shared.emotion.regret': {
    id: 'shared.emotion.regret',
    layer: 'L1',
    role: 'emotion',
    en: 'It is with deep regret that I write this letter to you.',
    zh: '我怀着深深的歉意给你写这封信。',
    cue: 'It is with deep regret',
    slots: [],
  },
  'shared.closing': {
    id: 'shared.closing',
    layer: 'L1',
    role: 'closing',
    en: 'I truly appreciate your sparing precious time to read this letter, and I look forward to your positive response.',
    zh: '衷心感谢你抽出宝贵时间阅读此信，期待你的积极回应。',
    cue: 'I truly appreciate',
    slots: [],
  },
  'shared.signoff': {
    id: 'shared.signoff',
    layer: 'L1',
    role: 'signoff',
    en: 'Yours sincerely,\nLi Ming',
    zh: '你诚挚的，李明',
    cue: 'Yours sincerely',
    slots: [],
  },

  // ===== L2 换用零件：第二段引导句（共用） =====
  'shared.lead.opinion': {
    id: 'shared.lead.opinion',
    layer: 'L2',
    role: 'lead',
    en: 'To justify my opinion, several points need to be mentioned as follows.',
    zh: '为说明我的观点，有必要提出以下几点。',
    cue: 'To justify my opinion',
    slots: [],
  },
  'shared.lead.specific': {
    id: 'shared.lead.specific',
    layer: 'L2',
    role: 'lead',
    en: 'To be more specific, several points need to be mentioned as follows.',
    zh: '更具体地说，以下几点需要提及。',
    cue: 'To be more specific',
    slots: [],
  },
  'shared.lead.arrangement': {
    id: 'shared.lead.arrangement',
    layer: 'L2',
    role: 'lead',
    en: 'In terms of concrete arrangement, several key details need to be mentioned as follows.',
    zh: '就具体安排而言，以下几点关键细节需要说明。',
    cue: 'In terms of concrete arrangement',
    slots: [],
  },
  'shared.lead.reasons': {
    id: 'shared.lead.reasons',
    layer: 'L2',
    role: 'lead',
    en: 'As for the underlying reasons, they can be explained as follows.',
    zh: '至于背后的原因，可以作如下解释。',
    cue: 'As for the underlying reasons',
    slots: [],
  },

  // ===== L2 换用零件：目的句（6 类书信） =====
  'suggest.purpose': {
    id: 'suggest.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to offer some suggestions on {{topicKeyword}}.',
    zh: '借此书信，我想就{{topicKeyword}}提供一些建议。',
    cue: 'With this letter, I would like to offer some suggestions on',
    slots: ['topicKeyword'],
  },
  'invite.purpose': {
    id: 'invite.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to invite you to {{topicKeyword}}.',
    zh: '借此书信，我想邀请你参加{{topicKeyword}}。',
    cue: 'With this letter, I would like to invite you to',
    slots: ['topicKeyword'],
  },
  'apology.purpose': {
    id: 'apology.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to apologize for {{topicKeyword}}.',
    zh: '借此书信，我想就{{topicKeyword}}向你道歉。',
    cue: 'With this letter, I would like to apologize for',
    slots: ['topicKeyword'],
  },
  'thanks.purpose': {
    id: 'thanks.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to express my gratitude for {{topicKeyword}}.',
    zh: '借此书信，我想对{{topicKeyword}}表达我的感激之情。',
    cue: 'With this letter, I would like to express my gratitude for',
    slots: ['topicKeyword'],
  },
  'intro.purpose': {
    id: 'intro.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to introduce {{topicKeyword}} to you.',
    zh: '借此书信，我想向你介绍{{topicKeyword}}。',
    cue: 'With this letter, I would like to introduce',
    slots: ['topicKeyword'],
  },
  'congrats.purpose': {
    id: 'congrats.purpose',
    layer: 'L2',
    role: 'purpose',
    en: 'With this letter, I would like to extend my warmest congratulations on {{topicKeyword}}.',
    zh: '借此书信，我想就{{topicKeyword}}向你致以最热烈的祝贺。',
    cue: 'With this letter, I would like to extend my warmest congratulations on',
    slots: ['topicKeyword'],
  },

  // ===== L2 换用零件：通知专用首段、结尾、标题与落款 =====
  'notice.heading': {
    id: 'notice.heading',
    layer: 'L2',
    role: 'heading',
    en: 'NOTICE',
    zh: '通知',
    cue: 'NOTICE',
    slots: [],
  },
  'notice.opening1': {
    id: 'notice.opening1',
    layer: 'L2',
    role: 'emotion',
    en: 'We greatly appreciate all students for sparing their precious time to pay attention to this notice.',
    zh: '我们十分感谢全体同学抽出宝贵时间关注本通知。',
    cue: 'We greatly appreciate all students',
    slots: [],
  },
  'notice.opening2': {
    id: 'notice.opening2',
    layer: 'L2',
    role: 'purpose',
    en: 'To ensure the smooth implementation of {{topicKeyword}}, the following arrangements are hereby announced.',
    zh: '为确保{{topicKeyword}}顺利开展，现将相关安排通知如下。',
    cue: 'To ensure the smooth implementation',
    slots: ['topicKeyword'],
  },
  'notice.closing': {
    id: 'notice.closing',
    layer: 'L2',
    role: 'closing',
    en: 'You are kindly requested to {{expectedAction}} so that {{topicWord}} can be implemented more effectively.',
    zh: '请你{{expectedAction}}，以便{{topicWord}}得到更有效的落实。',
    cue: 'You are kindly requested',
    resultWord: 'so that',
    slots: ['expectedAction', 'topicWord'],
  },
  'notice.signoff': {
    id: 'notice.signoff',
    layer: 'L2',
    role: 'signoff',
    en: "The Students' Union",
    zh: '学生会',
    cue: "The Students' Union",
    slots: [],
  },

  // ===== L2 备用祝贺信专用结尾 =====
  'congrats.closing': {
    id: 'congrats.closing',
    layer: 'L2',
    role: 'closing',
    en: 'I sincerely hope that you will make full use of this opportunity to {{expectedEffect}}.',
    zh: '我真诚地希望你能充分利用这次机会{{expectedEffect}}。',
    cue: 'I sincerely hope',
    slots: ['expectedEffect'],
  },

  // ===== L3 专属主体：建议信 (3 句) =====
  'suggest.body1': {
    id: 'suggest.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, attaching greater importance to {{aspect}} is strongly recommended, as it enables you to gain a clearer insight into {{topicWord}}.',
    zh: '首先，强烈建议更加重视{{aspect}}，这能使你更透彻地理解{{topicWord}}。',
    cue: 'First and foremost, attaching greater importance',
    resultWord: 'as it enables',
    connector: 'First and foremost',
    slots: ['aspect', 'topicWord'],
    storyNodeIndex: 0,
  },
  'suggest.body2': {
    id: 'suggest.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, you are advised to {{suggestedAction}} around {{topicWord}} so that you can gradually improve {{ability}}.',
    zh: '此外，建议你围绕{{topicWord}}去{{suggestedAction}}，这样你就能逐步提升{{ability}}。',
    cue: 'Furthermore, you are advised to',
    resultWord: 'so that',
    connector: 'Furthermore',
    slots: ['suggestedAction', 'topicWord', 'ability'],
    storyNodeIndex: 1,
  },
  'suggest.body3': {
    id: 'suggest.body3',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, it is advisable for you to {{action}}. Only in this way can you truly {{benefit}}.',
    zh: '最后，建议你{{action}}。只有这样，你才能真正{{benefit}}。',
    cue: 'Last but not least, it is advisable',
    resultWord: 'Only in this way',
    connector: 'Last but not least',
    slots: ['action', 'benefit'],
    storyNodeIndex: 2,
  },

  // ===== L3 专属主体：邀请信 (4 句) =====
  'invite.body1': {
    id: 'invite.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, the event will be held at {{location}} on {{date}}, which will offer you {{gainNoun}}.',
    zh: '首先，活动将于{{date}}在{{location}}举行，这将为你提供{{gainNoun}}。',
    cue: 'First and foremost, the event will be held',
    resultWord: 'which will offer',
    connector: 'First and foremost',
    slots: ['location', 'date', 'gainNoun'],
    storyNodeIndex: 0,
  },
  'invite.body2': {
    id: 'invite.body2',
    layer: 'L3',
    role: 'body',
    en: 'More specifically, your participation in {{topicWord}} would be greatly appreciated, as it will enable you to {{gainVerb1}}.',
    zh: '更具体地说，诚挚期待你参与{{topicWord}}，这将使你能够{{gainVerb1}}。',
    cue: 'More specifically, your participation',
    resultWord: 'as it will enable',
    connector: 'More specifically',
    slots: ['topicWord', 'gainVerb1'],
    storyNodeIndex: 1,
  },
  'invite.body3': {
    id: 'invite.body3',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, this will be a valuable opportunity for you to {{action}}, especially in the light of {{theme}}.',
    zh: '此外，这将是你{{action}}的宝贵机会，尤其是考虑到{{theme}}。',
    cue: 'Furthermore, this will be a valuable opportunity',
    connector: 'Furthermore',
    slots: ['action', 'theme'],
    storyNodeIndex: 2,
  },
  'invite.body4': {
    id: 'invite.body4',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, accepting this invitation will allow you to {{gainVerb2}}, which should not be missed.',
    zh: '最后，接受此次邀请将使你{{gainVerb2}}，这是不该错过的机会。',
    cue: 'Last but not least, accepting this invitation',
    resultWord: 'which should not be missed',
    connector: 'Last but not least',
    slots: ['gainVerb2'],
    storyNodeIndex: 3,
  },

  // ===== L3 专属主体：通知 (3 句) =====
  'notice.body1': {
    id: 'notice.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, the activity is arranged from {{startTime}} to {{endTime}}, during which {{activityContent}} will be carried out.',
    zh: '首先，本次活动定于{{startTime}}至{{endTime}}举办，期间将开展{{activityContent}}。',
    cue: 'First and foremost, the activity is arranged from',
    connector: 'First and foremost',
    slots: ['startTime', 'endTime', 'activityContent'],
    storyNodeIndex: 0,
  },
  'notice.body2': {
    id: 'notice.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, the main contents of the activity include {{content1}}, {{content2}} and {{content3}}.',
    zh: '此外，活动的主要内容包括{{content1}}、{{content2}}和{{content3}}。',
    cue: 'Furthermore, the main contents',
    connector: 'Furthermore',
    slots: ['content1', 'content2', 'content3'],
    storyNodeIndex: 1,
  },
  'notice.body3': {
    id: 'notice.body3',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, all participants are required to {{precaution}}, ensuring that the activity can proceed smoothly.',
    zh: '最后，所有参与者需要{{precaution}}，以确保活动顺利进行。',
    cue: 'Last but not least, all participants are required',
    resultWord: 'ensuring that',
    connector: 'Last but not least',
    slots: ['precaution'],
    storyNodeIndex: 2,
  },

  // ===== L3 专属主体：道歉信 (3 句) =====
  'apology.body1': {
    id: 'apology.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, my decision to {{wrongActionVerb}} in relation to {{incident}} turned out to be inconsiderate and unprofessional.',
    zh: '首先，我在{{incident}}上决定{{wrongActionVerb}}，事后证明这是欠考虑、不专业的。',
    cue: 'First and foremost, my decision to',
    connector: 'First and foremost',
    slots: ['wrongActionVerb', 'incident'],
    storyNodeIndex: 0,
  },
  'apology.body2': {
    id: 'apology.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, as a result of {{wrongActionDoing}}, you had to face {{impact}}, which should not have happened.',
    zh: '此外，由于{{wrongActionDoing}}，你不得不面对{{impact}}，这本不该发生。',
    cue: 'Furthermore, as a result of',
    connector: 'Furthermore',
    slots: ['wrongActionDoing', 'impact'],
    storyNodeIndex: 1,
  },
  'apology.body3': {
    id: 'apology.body3',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, concrete steps such as {{remedy}} will be taken, ensuring that similar problems with {{topicWord}} will not occur again.',
    zh: '最后，我将采取{{remedy}}等具体举措，确保今后在{{topicWord}}上不再发生类似问题。',
    cue: 'Last but not least, concrete steps',
    resultWord: 'ensuring that',
    connector: 'Last but not least',
    slots: ['remedy', 'topicWord'],
    storyNodeIndex: 2,
  },

  // ===== L3 专属主体：感谢信 (3 句) =====
  'thanks.body1': {
    id: 'thanks.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, your generous help in {{topicWord}} fully proves that you have {{goodQuality}}.',
    zh: '首先，你在{{topicWord}}上的慷慨帮助，充分证明了你具备{{goodQuality}}。',
    cue: 'First and foremost, your generous help',
    connector: 'First and foremost',
    slots: ['topicWord', 'goodQuality'],
    storyNodeIndex: 0,
  },
  'thanks.body2': {
    id: 'thanks.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, what impressed me most was your willingness to {{keyEffort}}, especially when dealing with {{topicWord}}.',
    zh: '此外，最让我印象深刻的是你乐于{{keyEffort}}，尤其是在处理{{topicWord}}的时候。',
    cue: 'Furthermore, what impressed me most',
    connector: 'Furthermore',
    slots: ['keyEffort', 'topicWord'],
    storyNodeIndex: 1,
  },
  'thanks.body3': {
    id: 'thanks.body3',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, your help in {{topicWord}} has encouraged me to {{futureAction}}, helping me reach {{nextGoal}}.',
    zh: '最后，你在{{topicWord}}上的帮助激励我去{{futureAction}}，助我迈向{{nextGoal}}。',
    cue: 'Last but not least, your help has encouraged me',
    resultWord: 'helping me reach',
    connector: 'Last but not least',
    slots: ['topicWord', 'futureAction', 'nextGoal'],
    storyNodeIndex: 2,
  },

  // ===== L3 专属主体：介绍类 (3 句) =====
  'intro.body1': {
    id: 'intro.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, {{topicWord}} refers to {{introTarget}}, which is characterized by {{coreFeature}}.',
    zh: '首先，{{topicWord}}是指{{introTarget}}，其突出特点在于{{coreFeature}}。',
    cue: 'First and foremost, ... refers to',
    connector: 'First and foremost',
    slots: ['topicWord', 'introTarget', 'coreFeature'],
    storyNodeIndex: 0,
  },
  'intro.body2': {
    id: 'intro.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, it covers {{coverageAspect}}, enabling {{audience}} to {{specificGain}}.',
    zh: '此外，它涵盖{{coverageAspect}}，使{{audience}}能够{{specificGain}}。',
    cue: 'Furthermore, it covers',
    resultWord: 'enabling',
    connector: 'Furthermore',
    slots: ['coverageAspect', 'audience', 'specificGain'],
    storyNodeIndex: 1,
  },
  'intro.body3': {
    id: 'intro.body3',
    layer: 'L3',
    role: 'body',
    en: 'Taken together, these features make {{topicWord}} an ideal choice for {{targetGroup}} who wish to {{targetNeed}}.',
    zh: '总的来说，这些特征使{{topicWord}}成为{{targetGroup}}实现{{targetNeed}}的理想选择。',
    cue: 'Taken together',
    connector: 'Taken together',
    slots: ['topicWord', 'targetGroup', 'targetNeed'],
    storyNodeIndex: 2,
  },

  // ===== L3 专属主体：（备用）祝贺信 (3 句) =====
  'congrats.body1': {
    id: 'congrats.body1',
    layer: 'L3',
    role: 'body',
    en: 'First and foremost, your outstanding performance in {{topicWord}} fully proves that you have {{goodQualityOrAbility}}.',
    zh: '首先，你在{{topicWord}}上的出色表现，充分证明了你具备{{goodQualityOrAbility}}。',
    cue: 'First and foremost, your outstanding performance',
    connector: 'First and foremost',
    slots: ['topicWord', 'goodQualityOrAbility'],
    storyNodeIndex: 0,
  },
  'congrats.body2': {
    id: 'congrats.body2',
    layer: 'L3',
    role: 'body',
    en: 'Furthermore, this success comes from your willingness to {{keyEffort}}, especially when dealing with {{topicWord}}.',
    zh: '此外，这一成功源于你乐于{{keyEffort}}，尤其是在处理{{topicWord}}的时候。',
    cue: 'Furthermore, this success comes from',
    connector: 'Furthermore',
    slots: ['keyEffort', 'topicWord'],
    storyNodeIndex: 1,
  },
  'congrats.body3': {
    id: 'congrats.body3',
    layer: 'L3',
    role: 'body',
    en: 'Last but not least, this achievement in {{topicWord}} will surely encourage you to {{futureAction}}, helping you reach {{nextGoal}}.',
    zh: '最后，{{topicWord}}上的这一成就必将激励你{{futureAction}}，助你迈向{{nextGoal}}。',
    cue: 'Last but not least, this achievement',
    resultWord: 'helping you reach',
    connector: 'Last but not least',
    slots: ['topicWord', 'futureAction', 'nextGoal'],
    storyNodeIndex: 2,
  },
};

export const TEMPLATES: Template[] = [
  {
    id: 'suggest',
    name: '建议信',
    priority: 1,
    storyLine: ['重视', '去做', '做成'],
    storyLineDetail: '认知 → 行动 → 好处',
    keywords: ['suggest', 'advice', 'recommend'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.pleasure',
      'suggest.purpose',
      'shared.lead.opinion',
      'suggest.body1',
      'suggest.body2',
      'suggest.body3',
      'shared.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.pleasure', 'suggest.purpose'],
      ['shared.lead.opinion', 'suggest.body1', 'suggest.body2', 'suggest.body3'],
      ['shared.closing'],
      ['shared.signoff'],
    ],
    warnings: [],
    firstWordChain:
      'It is a great pleasure → With this letter… offer some suggestions on → To justify my opinion → First and foremost, attaching greater importance → Furthermore, you are advised to → Last but not least, it is advisable → Only in this way → I truly appreciate',
  },
  {
    id: 'invite',
    name: '邀请信',
    priority: 2,
    storyLine: ['何时何地', '欢迎你来', '好机会', '别错过'],
    storyLineDetail: '时间地点 → 诚挚欢迎 → 宝贵机会 → 不容错过',
    keywords: ['invite'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.pleasure',
      'invite.purpose',
      'shared.lead.arrangement',
      'invite.body1',
      'invite.body2',
      'invite.body3',
      'invite.body4',
      'shared.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.pleasure', 'invite.purpose'],
      ['shared.lead.arrangement', 'invite.body1', 'invite.body2', 'invite.body3', 'invite.body4'],
      ['shared.closing'],
      ['shared.signoff'],
    ],
    warnings: [
      'on [日期]：填 Saturday / May 10，不要填 next Saturday（next 前面不能加 on）。',
      'offer you 后面填名词；enable you to / allow you to 后面填动词原形。两个动词收获最好不一样，比如一个写 broaden your horizons，一个写 make new friends。',
    ],
    firstWordChain:
      'It is a great pleasure → With this letter… invite you to → In terms of concrete arrangement → First and foremost, the event will be held → More specifically, your participation → Furthermore, this will be a valuable opportunity → Last but not least, accepting this invitation → I truly appreciate',
  },
  {
    id: 'notice',
    name: '通知',
    priority: 3,
    storyLine: ['什么时间', '做什么', '注意什么'],
    storyLineDetail: '何时 → 做啥 → 注意啥（结尾：请你行动）',
    keywords: ['notice', 'announce', 'inform'],
    sentenceIds: [
      'notice.heading',
      'notice.opening1',
      'notice.opening2',
      'shared.lead.arrangement',
      'notice.body1',
      'notice.body2',
      'notice.body3',
      'notice.closing',
      'notice.signoff',
    ],
    paragraphs: [
      ['notice.heading'],
      ['notice.opening1', 'notice.opening2'],
      ['shared.lead.arrangement', 'notice.body1', 'notice.body2', 'notice.body3'],
      ['notice.closing'],
      ['notice.signoff'],
    ],
    warnings: [
      '首句是 all students… their precious time（不是 your，原版这里是语法错误）。',
      "落款按题目要求写，题目说是哪个部门就写哪个部门，没说就写 The Students' Union。",
    ],
    firstWordChain:
      'NOTICE → We greatly appreciate all students → To ensure the smooth implementation → In terms of concrete arrangement → First and foremost, the activity is arranged from → Furthermore, the main contents → Last but not least, all participants are required → You are kindly requested',
  },
  {
    id: 'apology',
    name: '道歉信',
    priority: 4,
    storyLine: ['我错了', '害你了', '我会改'],
    storyLineDetail: '认错 → 后果 → 补救',
    keywords: ['apologize', 'sorry'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.regret',
      'apology.purpose',
      'shared.lead.reasons',
      'apology.body1',
      'apology.body2',
      'apology.body3',
      'shared.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.regret', 'apology.purpose'],
      ['shared.lead.reasons', 'apology.body1', 'apology.body2', 'apology.body3'],
      ['shared.closing'],
      ['shared.signoff'],
    ],
    warnings: [
      '同一个错误要写两种形式：my decision to + 动词原形（break my promise）；as a result of + doing / 名词（breaking my promise）。',
    ],
    firstWordChain:
      'It is with deep regret → With this letter… apologize for → As for the underlying reasons → First and foremost, my decision to → Furthermore, as a result of → Last but not least, concrete steps → I truly appreciate',
  },
  {
    id: 'thanks',
    name: '感谢信',
    priority: 5,
    storyLine: ['你帮了我', '你人真好', '我受益了'],
    storyLineDetail: '慷慨帮助 → 乐于付出 → 激励成长',
    keywords: ['thank', 'appreciate'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.pleasure',
      'thanks.purpose',
      'shared.lead.specific',
      'thanks.body1',
      'thanks.body2',
      'thanks.body3',
      'shared.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.pleasure', 'thanks.purpose'],
      ['shared.lead.specific', 'thanks.body1', 'thanks.body2', 'thanks.body3'],
      ['shared.closing'],
      ['shared.signoff'],
    ],
    warnings: [],
    firstWordChain:
      'It is a great pleasure → With this letter… express my gratitude for → To be more specific → First and foremost, your generous help → Furthermore, what impressed me most → Last but not least, your help has encouraged me → I truly appreciate',
  },
  {
    id: 'intro',
    name: '介绍类',
    priority: 6,
    storyLine: ['是什么', '有什么', '适合谁'],
    storyLineDetail: '下定义 → 讲内容 → 做推荐',
    keywords: ['introduce', 'describe', 'recommend'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.pleasure',
      'intro.purpose',
      'shared.lead.specific',
      'intro.body1',
      'intro.body2',
      'intro.body3',
      'shared.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.pleasure', 'intro.purpose'],
      ['shared.lead.specific', 'intro.body1', 'intro.body2', 'intro.body3'],
      ['shared.closing'],
      ['shared.signoff'],
    ],
    warnings: [],
    firstWordChain:
      'It is a great pleasure → With this letter… introduce… to you → To be more specific → First and foremost, … refers to → Furthermore, it covers → Taken together → I truly appreciate',
  },
  {
    id: 'congrats',
    name: '（备用）祝贺信',
    priority: 7,
    optional: true,
    storyLine: ['你很优秀', '因为努力', '继续前进'],
    storyLineDetail: '出色表现 → 源于努力 → 激励前行',
    keywords: ['congratulate'],
    sentenceIds: [
      'shared.salutation',
      'shared.emotion.pleasure',
      'congrats.purpose',
      'shared.lead.specific',
      'congrats.body1',
      'congrats.body2',
      'congrats.body3',
      'congrats.closing',
      'shared.signoff',
    ],
    paragraphs: [
      ['shared.salutation'],
      ['shared.emotion.pleasure', 'congrats.purpose'],
      ['shared.lead.specific', 'congrats.body1', 'congrats.body2', 'congrats.body3'],
      ['congrats.closing'],
      ['shared.signoff'],
    ],
    warnings: ['优先级最低，前六类背熟了再背；结尾也可以换成通用结尾。'],
    firstWordChain:
      'It is a great pleasure → With this letter… extend my warmest congratulations on → To be more specific → First and foremost, your outstanding performance → Furthermore, this success comes from → Last but not least, this achievement → I sincerely hope',
  },
];

export const TEMPLATE_MAP: Record<TemplateId, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
) as Record<TemplateId, Template>;

/**
 * 课程学习顺序（供第一阶段学习页按层级推进，去除共用句重复）
 */
export interface Lesson {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  templateId?: TemplateId;
  optional?: boolean;
  sentenceIds: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    order: 1,
    title: '第 1 课 · L1 通用骨架',
    subtitle: '情绪句 ×2、通用结尾（共用句只背一次）',
    sentenceIds: ['shared.emotion.pleasure', 'shared.emotion.regret', 'shared.closing'],
  },
  {
    id: 'lesson-2',
    order: 2,
    title: '第 2 课 · L2 目的句与引导句',
    subtitle: '6 个书信目的句 + 4 个第二段引导句',
    sentenceIds: [
      'suggest.purpose',
      'invite.purpose',
      'apology.purpose',
      'thanks.purpose',
      'intro.purpose',
      'congrats.purpose',
      'shared.lead.opinion',
      'shared.lead.specific',
      'shared.lead.arrangement',
      'shared.lead.reasons',
    ],
  },
  {
    id: 'lesson-3',
    order: 3,
    title: '第 3 课 · 建议信主体',
    subtitle: '重视 → 去做 → 做成',
    templateId: 'suggest',
    sentenceIds: ['suggest.body1', 'suggest.body2', 'suggest.body3'],
  },
  {
    id: 'lesson-4',
    order: 4,
    title: '第 4 课 · 邀请信主体',
    subtitle: '何时何地 → 欢迎你来 → 好机会 → 别错过',
    templateId: 'invite',
    sentenceIds: ['invite.body1', 'invite.body2', 'invite.body3', 'invite.body4'],
  },
  {
    id: 'lesson-5',
    order: 5,
    title: '第 5 课 · 通知（首段、主体、结尾）',
    subtitle: '什么时间 → 做什么 → 注意什么',
    templateId: 'notice',
    sentenceIds: [
      'notice.opening1',
      'notice.opening2',
      'notice.body1',
      'notice.body2',
      'notice.body3',
      'notice.closing',
    ],
  },
  {
    id: 'lesson-6',
    order: 6,
    title: '第 6 课 · 道歉信主体',
    subtitle: '我错了 → 害你了 → 我会改',
    templateId: 'apology',
    sentenceIds: ['apology.body1', 'apology.body2', 'apology.body3'],
  },
  {
    id: 'lesson-7',
    order: 7,
    title: '第 7 课 · 感谢信主体',
    subtitle: '你帮了我 → 你人真好 → 我受益了',
    templateId: 'thanks',
    sentenceIds: ['thanks.body1', 'thanks.body2', 'thanks.body3'],
  },
  {
    id: 'lesson-8',
    order: 8,
    title: '第 8 课 · 介绍类主体',
    subtitle: '是什么 → 有什么 → 适合谁',
    templateId: 'intro',
    sentenceIds: ['intro.body1', 'intro.body2', 'intro.body3'],
  },
  {
    id: 'lesson-9',
    order: 9,
    title: '第 9 课 · 祝贺信（备用）',
    subtitle: '你很优秀 → 因为努力 → 继续前进',
    templateId: 'congrats',
    optional: true,
    sentenceIds: ['congrats.body1', 'congrats.body2', 'congrats.body3', 'congrats.closing'],
  },
];

/**
 * 将带 {{slotId}} 的模板句子渲染为带 [槽位标签] 的可读文本，用于与原文逐字比对
 */
export function renderSentenceWithLabels(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, id: string) => {
    const slot = SLOTS[id];
    return slot ? `[${slot.label}]` : `[${id}]`;
  });
}

/**
 * 将整个模板按段落拼回完整英文文本（槽位以 [中文标签] 显示）
 */
export function reconstructTemplateText(template: Template): string {
  return template.paragraphs
    .map((para) =>
      para
        .map((sid) => renderSentenceWithLabels(SENTENCES[sid].en))
        .join(' '),
    )
    .join('\n\n');
}

/**
 * 查找某个句子被哪些模板引用（用于展示共用句关系与定位标签）
 */
export function getSentenceTemplates(sentenceId: string): Template[] {
  return TEMPLATES.filter((t) => t.sentenceIds.includes(sentenceId));
}

export function getSentenceLocationLabel(sentenceId: string): string {
  const s = SENTENCES[sentenceId];
  if (!s) return '';
  if (sentenceId.startsWith('shared.')) {
    const usedBy = getSentenceTemplates(sentenceId);
    if (s.role === 'emotion') {
      return `共用骨架 · 情绪句（${usedBy.map((t) => t.name.replace('（备用）', '')).join(' / ')}）`;
    }
    if (s.role === 'lead') {
      return `共用引导句（${usedBy.map((t) => t.name.replace('（备用）', '')).join(' / ')}）`;
    }
    if (s.role === 'closing') {
      return `共用结尾（${usedBy.length} 篇共用）`;
    }
    return '共用骨架';
  }
  const tpl = TEMPLATES.find((t) => t.sentenceIds.includes(sentenceId));
  const prefix = tpl ? tpl.name : '';
  if (s.role === 'purpose') return `${prefix} · 目的句`;
  if (s.role === 'emotion') return `${prefix} · 首段第 1 句`;
  if (s.role === 'closing') return `${prefix} · 结尾句`;
  if (s.role === 'body') {
    const bodyIdx = (s.storyNodeIndex ?? 0) + 1;
    return `${prefix} · 主体第 ${bodyIdx} 句`;
  }
  return prefix;
}
