import type { TemplateId } from './types';

export interface ExamPrompt {
  id: string;
  templateId: TemplateId;
  title: string;
  directions: string;
  suggestedKeywords: string[];
  tricky?: boolean;
  trickyHint?: string;
}

export const PROMPTS: ExamPrompt[] = [
  // ===== 建议信 (3 道，含 1 道易混题) =====
  {
    id: 'suggest-1',
    templateId: 'suggest',
    title: '校园图书馆服务改进建议',
    directions:
      'Directions: Write a letter to the librarian of your university to offer some suggestions on improving the library services, including extending opening hours and adding more study seats. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['improving the library services', 'library services'],
  },
  {
    id: 'suggest-2',
    templateId: 'suggest',
    title: '留学生汉语学习方法建议',
    directions:
      'Directions: Your foreign friend Jack has written to ask for advice on how to improve his spoken Chinese. Write him a letter to give your suggestions and explain your reasons. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['improving your spoken Chinese', 'spoken Chinese'],
  },
  {
    id: 'suggest-3',
    templateId: 'suggest',
    title: '易混：recommend 备考做法（建议信）',
    directions:
      'Directions: Your classmate Tom feels anxious about the upcoming graduate entrance examination. Write a letter to recommend some effective study methods and time-management strategies for his preparation. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['effective study methods', 'exam preparation'],
    tricky: true,
    trickyHint: '虽然题干出现 recommend，但对象是「做法与策略」（study methods），属于建议信，不是介绍具体事物。',
  },

  // ===== 邀请信 (3 道，含 1 道易混题) =====
  {
    id: 'invite-1',
    templateId: 'invite',
    title: '邀请外教参加中秋文化节',
    directions:
      'Directions: Write a letter to Professor Smith, a foreign teacher at your university, to invite him to attend the Mid-Autumn Cultural Festival held by the Students\' Union next Saturday evening. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['the Mid-Autumn Cultural Festival', 'cultural festival'],
  },
  {
    id: 'invite-2',
    templateId: 'invite',
    title: '邀请校友作职业规划讲座',
    directions:
      'Directions: Write a letter to an alumnus, Mr. Zhang, to invite him to give a lecture on career planning for graduating students at the university auditorium. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['a lecture on career planning', 'career planning'],
  },
  {
    id: 'invite-3',
    templateId: 'invite',
    title: '易混：inform 单个朋友并邀约（邀请信）',
    directions:
      'Directions: Your university will host an international photography exhibition this Sunday. Write a letter to inform your foreign friend Lucy about the arrangement and cordially ask her to join you there. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['the international photography exhibition', 'photography exhibition'],
    tricky: true,
    trickyHint: '题干出现 inform，但收信人是单个朋友 Lucy 且核心目的是邀约同行，属于邀请信而非面向全体的通知。',
  },

  // ===== 通知 (3 道，含 1 道易混题) =====
  {
    id: 'notice-1',
    templateId: 'notice',
    title: '校园环保志愿活动招募通知',
    directions:
      'Directions: Suppose you are a member of the Students\' Union. Write a notice to recruit student volunteers for the Campus Green Week activity, stating the time, main tasks and requirements. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "The Students\' Union" instead.',
    suggestedKeywords: ['the Campus Green Week activity', 'volunteer recruitment'],
  },
  {
    id: 'notice-2',
    templateId: 'notice',
    title: '英语演讲比赛报名通知',
    directions:
      'Directions: Write a notice on behalf of the English Club to announce the annual Campus English Speech Contest, including the schedule, competition contents and registration details. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "The English Club" instead.',
    suggestedKeywords: ['the Campus English Speech Contest', 'speech contest'],
  },
  {
    id: 'notice-3',
    templateId: 'notice',
    title: '易混：inform 全体学生讲座变更（通知）',
    directions:
      'Directions: Write a notice to inform all postgraduate students of the upcoming Academic Writing Workshop organized by the Graduate School, specifying the time, main topics and precautions for attendees. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "The Graduate School" instead.',
    suggestedKeywords: ['the Academic Writing Workshop', 'academic workshop'],
    tricky: true,
    trickyHint: '面向全体学生（all postgraduate students）发布安排与注意事项，属于标准通知（NOTICE）。',
  },

  // ===== 道歉信 (3 道，含 1 道易混题) =====
  {
    id: 'apology-1',
    templateId: 'apology',
    title: '因突发情况爽约道歉',
    directions:
      'Directions: You promised to show your foreign friend David around the city museum this weekend, but you have to cancel the appointment due to an urgent family matter. Write him a letter to apologize and propose a remedy. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['canceling our appointment', 'the city museum visit'],
  },
  {
    id: 'apology-2',
    templateId: 'apology',
    title: '延迟归还借阅书籍道歉',
    directions:
      'Directions: You borrowed a reference book from Professor Wang two weeks ago and failed to return it on time. Write a letter to apologize for the delay, explain the reason and state how you will make up for it. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['returning the reference book late', 'the delayed return'],
  },
  {
    id: 'apology-3',
    templateId: 'apology',
    title: '易混：无法参加邀请并致歉（道歉信）',
    directions:
      'Directions: Your friend Emily invited you to her graduation dinner party, but you cannot attend because of a schedule conflict with an academic conference. Write a letter to express your regret and apologize for missing the event. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['missing your graduation dinner party', 'my absence'],
    tricky: true,
    trickyHint: '题干虽然提到 invited，但你的核心写作任务是「因故无法赴约并致歉」，应套用道歉信模板（regret）。',
  },

  // ===== 感谢信 (3 道，含 1 道易混题) =====
  {
    id: 'thanks-1',
    templateId: 'thanks',
    title: '感谢外教修改英文简历',
    directions:
      'Directions: Professor Brown generously helped you polish your English resume and prepared you for an important interview. Write him a letter to express your sincere gratitude. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['your generous help with my resume', 'interview preparation'],
  },
  {
    id: 'thanks-2',
    templateId: 'thanks',
    title: '感谢寄宿家庭的热情款待',
    directions:
      'Directions: You have just returned to China after a one-month exchange program in London. Write a letter to your host family, Mr. and Mrs. Green, to thank them for their warm hospitality and care during your stay. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['your warm hospitality', 'my stay in London'],
  },
  {
    id: 'thanks-3',
    templateId: 'thanks',
    title: '易混：获奖后致谢指导老师（感谢信）',
    directions:
      'Directions: You recently won first prize in a national translation contest thanks to Dr. Lin\'s patient guidance. Write a letter to express your appreciation for his support throughout the preparation. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['your patient guidance', 'the translation contest'],
    tricky: true,
    trickyHint: '题干提到获奖（won first prize），但获奖者是「你自己」，写信对象是指导老师，核心是感谢而非祝贺。',
  },

  // ===== 介绍类 (3 道，含 1 道易混题) =====
  {
    id: 'intro-1',
    templateId: 'intro',
    title: '介绍中国传统节日端午节',
    directions:
      'Directions: Your foreign pen pal Alex is interested in traditional Chinese culture. Write a letter to introduce the Dragon Boat Festival, including its meaning, main customs and cultural value. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['the Dragon Boat Festival', 'traditional Chinese festival'],
  },
  {
    id: 'intro-2',
    templateId: 'intro',
    title: '介绍家乡的历史文化名胜',
    directions:
      'Directions: An international student plans to visit your hometown during the winter vacation. Write a letter to introduce a famous historical site in your hometown and explain why it is worth visiting. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['a famous historical site', 'this historical attraction'],
  },
  {
    id: 'intro-3',
    templateId: 'intro',
    title: '易混：recommend 一本中文经典书籍（介绍类）',
    directions:
      'Directions: Your foreign friend Sarah wants to read a classic Chinese novel in translation. Write a letter to recommend a book to her, describing its main theme, features and why it suits her. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['a classic Chinese novel', 'this classic book'],
    tricky: true,
    trickyHint: '虽然题干用了 recommend，但推荐对象是「具体事物（一本书）」，需要下定义、讲内容、说适合谁，应套用介绍类模板。',
  },

  // ===== （备用）祝贺信 (3 道) =====
  {
    id: 'congrats-1',
    templateId: 'congrats',
    title: '祝贺朋友被理想研究生院录取',
    directions:
      'Directions: Your close friend Kevin has just been admitted to his dream graduate school. Write a letter to congratulate him on this achievement and express your best wishes for his future studies. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['your admission to graduate school', 'graduate studies'],
  },
  {
    id: 'congrats-2',
    templateId: 'congrats',
    title: '祝贺同学获得国家级奖学金',
    directions:
      'Directions: Your classmate Mei has been awarded the National Scholarship for her academic excellence. Write a letter to extend your warmest congratulations on her success. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['winning the National Scholarship', 'academic excellence'],
  },
  {
    id: 'congrats-3',
    templateId: 'congrats',
    title: '祝贺外教出版学术新书',
    directions:
      'Directions: Professor Miller has recently published a new academic book on cross-cultural communication. Write a letter to congratulate him on this remarkable accomplishment. You should write about 100 words on the ANSWER SHEET. Do not use your own name. Use "Li Ming" instead.',
    suggestedKeywords: ['publishing your new book', 'cross-cultural communication'],
  },
];
