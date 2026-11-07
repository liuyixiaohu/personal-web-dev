export interface ShowcaseMedia {
  /** Path under `public/`, e.g. `/images/luma-autofiller/demo.gif`. */
  src: string;
  alt: string;
  /** `image` covers PNG, WebP, and GIF; `video` renders a muted looping clip. */
  kind: 'image' | 'video';
}

export interface ShowcaseLink {
  href: string;
  label: string;
}

export interface ShowcaseItem {
  title: string;
  body: string;
}

export interface ProjectShowcase {
  name: string;
  status: string;
  tagline: string;
  pitch: string;
  /** `null` shows the placeholder mock-up with a "Demo coming soon" caption. */
  media: ShowcaseMedia | null;
  /** `null` shows a "coming soon" label instead of a link. */
  link: ShowcaseLink | null;
  steps: ShowcaseItem[];
  principles: ShowcaseItem[];
}

export const lumaAutofiller: ProjectShowcase = {
  name: 'Luma Autofiller',
  status: 'In progress',
  tagline: 'Fill Luma registration forms from answers you already wrote. You still press submit.',
  pitch:
    'Luma event applications keep asking the same questions: who you are, what you are building, why you want to attend. Luma Autofiller is a Chrome extension that drafts those answers from your profile and a library of answers you have saved, fills the form, and shows where every answer came from.',
  media: null,
  link: null,
  steps: [
    {
      title: 'Open the registration page',
      body: 'On a lu.ma event registration form, click the extension.',
    },
    {
      title: 'It reads the questions',
      body: 'Each question on the form is read along with its field type.',
    },
    {
      title: 'It drafts the answers',
      body: 'Answers come from your profile and saved Q&A, with an LLM filling the gaps. If it does not know an answer, the field stays blank instead of being made up.',
    },
    {
      title: 'You review and submit',
      body: 'Every field is highlighted with its source: profile, saved answer, AI, or unanswered. Edit anything, then click submit yourself.',
    },
  ],
  principles: [
    {
      title: 'Your data stays local',
      body: 'Your profile and saved answers are stored in the extension on your device.',
    },
    {
      title: 'Your own key',
      body: 'AI drafts use the LLM API key you provide.',
    },
    {
      title: 'You press submit',
      body: 'It fills the form and stops. Nothing is sent to the organizer until you click submit.',
    },
  ],
};
