export type PostPurpose = "save" | "empathy" | "comment" | "newbie";

export interface FormInput {
  theme: string;
  content: string;
  purpose: PostPurpose;
  frequentWords: string;
  avoidWords: string;
  tone: string;
  useEmoji: boolean;
}

export interface GeneratedOutput {
  hooks: string[];
  bodies: string[];
  ctas: string[];
  hashtagPolicy: string;
  ngPoints: string[];
}

const purposeLabels: Record<PostPurpose, string> = {
  save: "保存狙い",
  empathy: "共感狙い",
  comment: "コメント狙い",
  newbie: "新規向け",
};

const hookTemplates: Record<PostPurpose, string[]> = {
  save: [
    "保存必須。{theme}について知っておくべきこと。",
    "あとで見返したくなる。{theme}の本質。",
    "{theme}を理解している人は、こう考えている。",
    "見落としがちな{theme}の真実、まとめました。",
    "知っておくと差がつく。{theme}の話。",
  ],
  empathy: [
    "{theme}、なんか苦手だと思ってたのは私だけじゃないはず。",
    "正直に言う。{theme}って思ったより難しい。",
    "{theme}で悩んでるの、あなただけじゃないよ。",
    "うまくいかない{theme}、その理由に気づいた日の話。",
    "{theme}に疲れてる人に、届いてほしい。",
  ],
  comment: [
    "{theme}って、あなたはどう思う？",
    "{theme}について、正直な意見を聞かせてほしい。",
    "みんなは{theme}、どうしてる？",
    "{theme}の話、コメントで教えてください。",
    "{theme}に対する本音、気になる。",
  ],
  newbie: [
    "{theme}をはじめて知った人へ。",
    "{theme}って何？から始める人のための投稿。",
    "{theme}、難しそうに見えるけど実はシンプル。",
    "初めての{theme}。知っておくといい基本のこと。",
    "{theme}のことが、今日から少しわかるかも。",
  ],
};

const bodyTemplates: Record<PostPurpose, string[]> = {
  save: [
    `{content}

これを知ってからは、見え方が変わった。

{theme}について深く考えるとき、この視点が軸になる。
細かいことより、本質を押さえておくこと。
それだけで、判断がずっと楽になる。`,
    `{theme}について、整理してみた。

{content}

情報は多いけど、大事なのはいくつかのポイントに絞られる。
何度も読み返して、自分のものにしてほしい。`,
    `知っておきたい{theme}のこと。

{content}

「なんとなく」で進めるより、
こういう基準を持っておくと、行動が変わってくる。`,
  ],
  empathy: [
    `{theme}って、正直むずかしい。

{content}

うまくいかない日もある。
でもそれは、向き合っている証拠だと思ってる。`,
    `ずっと{theme}のことが頭にあって。

{content}

完璧じゃなくていい。
こうやって少しずつ、自分のペースで。`,
    `{theme}に悩んでいたとき、こんなことを考えていた。

{content}

同じ気持ちの人がいたら、少し楽になってほしくて書いた。`,
  ],
  comment: [
    `{theme}について、最近すごく考えていることがある。

{content}

みんなはどう感じてる？
正解がないテーマだからこそ、いろんな意見が聞きたい。`,
    `{theme}って、人によって全然ちがうと思う。

{content}

あなたはどうしてる？
コメントで教えてもらえると嬉しい。`,
    `{theme}の話、少し聞いてほしい。

{content}

賛否あると思うし、それでいい。
あなたの考えを教えてください。`,
  ],
  newbie: [
    `{theme}を知らなかった頃の自分に教えたいこと。

{content}

むずかしく考えなくていい。
まずはこれだけ覚えておけば大丈夫。`,
    `{theme}、はじめて聞く人へ。

{content}

最初はみんな知らないところからスタートしてる。
焦らず、一つずつ。`,
    `{theme}ってなに？という人のために。

{content}

シンプルに言うと、こういうことです。
わからないことはコメントで聞いてください。`,
  ],
};

const ctaTemplates: Record<PostPurpose, string[]> = {
  save: [
    "あとで見返したい人は保存を。",
    "役に立ったら保存＆シェアしてもらえると嬉しいです。",
    "このまとめが参考になったら、保存しておいてください。",
  ],
  empathy: [
    "共感してくれたら、いいねで教えてください。",
    "同じ気持ちの人がいたら、コメントを。",
    "誰かに届いてほしくて書きました。シェアしてもらえると。",
  ],
  comment: [
    "あなたの意見をコメントで聞かせてください。",
    "どう思う？コメントで話しましょう。",
    "コメントで一言だけでも教えてほしいです。",
  ],
  newbie: [
    "わからないことはコメントで気軽に聞いてください。",
    "役に立ったらフォローしてもらえると励みになります。",
    "もっと詳しく知りたい人はプロフィールのリンクから。",
  ],
};

const hashtagPolicies: Record<PostPurpose, string> = {
  save: `保存率を上げるため、ニッチ〜中規模タグを中心に選ぶ。\n「#{theme}まとめ」「#{theme}メモ」など、保存文脈に合うタグを使用。\n大タグ（100万件超）は1〜2個に絞り、流されにくい構成にする。\n目安: 10〜15個。`,
  empathy: `共感を呼ぶ感情ワードのタグを選ぶ。\n「#{theme}あるある」「#{theme}で悩んでる」など生活密着型タグを使用。\n幅広い層に届けるため、中〜大タグのバランスを取る。\n目安: 8〜12個。`,
  comment: `コメントを誘発する問いかけタグを活用。\n「#{theme}話したい」「#{theme}どう思う」などを組み合わせる。\nターゲット層が集まるコミュニティタグを2〜3個追加する。\n目安: 8〜12個。`,
  newbie: `入門・基礎系タグで検索流入を狙う。\n「#{theme}初心者」「#{theme}入門」「#{theme}とは」などを使用。\n新規フォロワー獲得のため、ある程度ボリュームのあるタグも混ぜる。\n目安: 10〜15個。`,
};

const ngPointsBase: Record<PostPurpose, string[]> = {
  save: [
    "情報を詰め込みすぎて「読む気が失せる」構成になっていないか確認する",
    "箇条書きが多すぎると保存されても読まれないまま終わるリスクがある",
    "専門用語を多用して初見者が離脱するパターンに注意",
  ],
  empathy: [
    "ネガティブすぎる言葉は共感ではなく不安を煽るので使わない",
    "「みんなそうだよ」の一般化は逆に共感を薄める場合がある",
    "オチのない愚痴投稿にならないよう、前向きなトーンで締める",
  ],
  comment: [
    "「どう思いますか？」だけでは弱い。具体的な問いを1つに絞る",
    "答えにくい二択や重すぎるテーマはコメントへの心理的ハードルを上げる",
    "本文が長すぎるとコメントの前に離脱する",
  ],
  newbie: [
    "初心者向けと言いながら専門用語を使う矛盾に注意",
    "「知らないの？」という上から目線のニュアンスが出ていないか確認",
    "説明を詰め込みすぎず、1投稿1ポイントに絞る",
  ],
};

function applyTemplate(template: string, theme: string, content: string): string {
  return template
    .replace(/\{theme\}/g, theme || "このテーマ")
    .replace(/\{content\}/g, content || "伝えたい内容をここに");
}

function worldviewNGPoints(input: FormInput): string[] {
  const points: string[] = [];
  if (input.avoidWords) {
    const words = input.avoidWords.split(/[,、,\s]+/).filter(Boolean);
    if (words.length > 0) {
      points.push(`「${words.slice(0, 3).join("」「")}」などの表現は世界観に合わないため使用しない`);
    }
  }
  if (!input.useEmoji) {
    points.push("絵文字はOFFに設定されているため、本文・フック・CTAに含めないこと");
  }
  if (input.tone) {
    points.push(`口調は「${input.tone}」に統一すること。混在すると世界観が崩れる`);
  }
  return points;
}

export function generateOutput(input: FormInput): GeneratedOutput {
  const { theme, content, purpose } = input;

  const hooks = hookTemplates[purpose].map((t) =>
    applyTemplate(t, theme, content)
  );

  const bodies = bodyTemplates[purpose].map((t) =>
    applyTemplate(t, theme, content)
  );

  const ctas = ctaTemplates[purpose];

  const hashtagPolicy = hashtagPolicies[purpose].replace(/\{theme\}/g, theme || "テーマ");

  const ngPoints = [
    ...ngPointsBase[purpose],
    ...worldviewNGPoints(input),
  ];

  return { hooks, bodies, ctas, hashtagPolicy, ngPoints };
}
