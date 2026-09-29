/* مقاطع «قبل ← بعد» — خدمة: فيديو بالذكاء الاصطناعي
   المسارات نسبية لجذر الموقع (index.html / ai-gallery.html). من داخل projects/ أضف "../".
   type: 'slider' = المقطعين متطابقين في الكادر والتوقيت (سحب فوق بعض)
         'side'   = غير متطابقين — يُعرضان جنب بعض
   كل الملفات: H.264 بدون صوت، faststart، ≤ 1024px على الضلع الطويل.
   poster = إطار من «بعد»، poster_before = نفس اللحظة من «قبل» (للسلايدر قبل التحميل).
   alt / alt_before = وصف الإطارين (نص بديل لبطاقة الفيديو في الرئيسية).
   consent_note: لو فيه نص = المقطع ينتظر موافقة الشخص اللي فيه. الرئيسية تفضّل مقطع بدون ملاحظة،
   بس المعرض يعرض الكل — قبل النشر احذف أي مقطع ما تأكدت موافقته، أو احذف الملاحظة بعد الموافقة.
   (٢٩ سبتمبر ٢٠٢٦: رائد أكّد موافقة كل الأشخاص في المقاطع الخمسة، وانشالت ملاحظاتها) */
window.VIDEOS = [
  {
    slug: 'archer',
    project: 'bp',
    brand: 'بندر بطاطا',
    title: 'عصا حديد وصارت قوس',
    desc: 'بندر ينشّن قدّام المطعم، الله يستر على الزباين.',
    alt: 'بندر نازل على ركبته يشدّ قوس على الرصيف قدّام المطعم وقت الغروب',
    alt_before: 'شخص نازل على ركبته بقفازات بيض وماسك عصا حديد قدّام خلفية خضراء',
    type: 'slider',
    before: 'assets/video/archer-before.mp4',
    after: 'assets/video/archer-after.mp4',
    poster: 'assets/video/archer-poster.jpg',
    poster_before: 'assets/video/archer-before-poster.jpg',
    w: 1024, h: 576,
    duration: 8
  },
  {
    slug: 'oud',
    project: null,
    brand: '',
    title: 'يعزف على الهوا',
    desc: 'وأنا جبت له العود.',
    alt: 'عازف بثوب أبيض قاعد على كرسي والعود في حضنه، والإضاءة عليه بس في غرفة ظلمة',
    alt_before: 'شخص بثوب أبيض قاعد على كرسي ويعزف بيدين فاضية قدّام خلفية خضراء',
    type: 'slider',
    before: 'assets/video/oud-before.mp4',
    after: 'assets/video/oud-after.mp4',
    poster: 'assets/video/oud-poster.jpg',
    poster_before: 'assets/video/oud-before-poster.jpg',
    w: 1024, h: 576,
    duration: 6
  },
  {
    slug: 'tokhma',
    project: 'bp',
    brand: 'بندر بطاطا',
    title: 'شبع لين ما قدر يقوم',
    desc: 'ذا الشعور أعرفه زين.',
    alt: 'بندر مرخي على كرسي داخل المطعم وجنبه طاولة',
    alt_before: 'شخص مرخي على كرسي بالاستوديو وجنبه ستول قدّام خلفية خضراء',
    type: 'slider',
    before: 'assets/video/tokhma-before.mp4',
    after: 'assets/video/tokhma-after.mp4',
    poster: 'assets/video/tokhma-poster.jpg',
    poster_before: 'assets/video/tokhma-before-poster.jpg',
    w: 576, h: 1024,
    duration: 5
  },
  {
    slug: 'backrooms',
    project: 'bp',
    brand: 'بندر بطاطا',
    title: 'بندر ضايع بالباك رومز',
    desc: 'لاصق أذنه بالجدار، ودي أعرف وش يسمع.',
    alt: 'بندر لاصق أذنه على جدار في ممر أصفر طويل',
    alt_before: 'شخص لاصق أذنه على ورق برتقالي بالاستوديو',
    type: 'slider',
    before: 'assets/video/backrooms-before.mp4',
    after: 'assets/video/backrooms-after.mp4',
    poster: 'assets/video/backrooms-poster.jpg',
    poster_before: 'assets/video/backrooms-before-poster.jpg',
    w: 576, h: 1024,
    duration: 8
  },
  {
    slug: 'peephole',
    project: 'bp',
    brand: 'بندر بطاطا',
    title: 'لا تفتح الباب',
    desc: 'جايك من آخر الممر، ومبتسم زيادة عن اللزوم.',
    alt: 'بندر جاي من آخر ممر أصفر، والكادر من عين الباب',
    alt_before: 'وجه يطلّ من فتحة مدوّرة في ورق بنّي',
    type: 'side',
    before: 'assets/video/peephole-before.mp4',
    after: 'assets/video/peephole-after.mp4',
    poster: 'assets/video/peephole-poster.jpg',
    poster_before: 'assets/video/peephole-before-poster.jpg',
    w: 576, h: 1024,
    duration: 4
  }
];
