// 한국인이 사랑하는 실내 식물 32종 물주기 및 정보 데이터베이스
// 로컬 파일 더블클릭(file:///) 실행 시 브라우저 CORS 보안 정책 오류를 원천 차단하기 위해 글로벌 네임스페이스에 선언합니다.
window.plantDatabase = [
  {
    name: "몬스테라",
    scientificName: "Monstera deliciosa",
    waterPeriod: 7,
    light: "반양지 (창가 안쪽)",
    difficulty: "쉬움",
    tip: "겉흙이 마르면 물을 흠뻑 주세요. 공중습도가 높은 것을 좋아해 잎에 분무해주면 좋습니다."
  },
  {
    name: "스투키",
    scientificName: "Sansevieria stuckyi",
    waterPeriod: 30,
    light: "반음지/음지",
    difficulty: "아주 쉬움",
    tip: "한 달에 한 번 정도 흙이 바짝 말랐을 때 물을 줍니다. 과습에 매우 취약하니 주의하세요."
  },
  {
    name: "산세베리아",
    scientificName: "Sansevieria trifasciata",
    waterPeriod: 25,
    light: "반음지",
    difficulty: "아주 쉬움",
    tip: "겨울철에는 물주는 주기를 더 늘리고, 흙이 속까지 완전히 말랐을 때 물을 흠뻑 줍니다."
  },
  {
    name: "테이블야자",
    scientificName: "Chamaedorea elegans",
    waterPeriod: 8,
    light: "반음지/반양지",
    difficulty: "쉬움",
    tip: "강한 직사광선은 피하고, 흙 표면이 마르면 물을 줍니다. 건조할 때는 잎에 분무해주세요."
  },
  {
    name: "스킨답서스",
    scientificName: "Epipremnum aureum",
    waterPeriod: 7,
    light: "반음지",
    difficulty: "아주 쉬움",
    tip: "어두운 곳에서도 잘 자라며 흙이 마르면 물을 줍니다. 수경재배로도 매우 잘 자랍니다."
  },
  {
    name: "아레카야자",
    scientificName: "Dypsis lutescens",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "보통",
    tip: "천연 가습기라 불릴 만큼 증산작용이 활발합니다. 흙을 촉촉하게 유지하되 배수가 잘 되어야 합니다."
  },
  {
    name: "홍콩야자",
    scientificName: "Schefflera arboricola",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "쉬움",
    tip: "겉흙이 마르면 흠뻑 주고, 실내가 건조하면 잎이 떨어질 수 있으니 물 분무를 자주 해주세요."
  },
  {
    name: "유칼립투스",
    scientificName: "Eucalyptus globulus",
    waterPeriod: 3,
    light: "양지 (햇빛 가득)",
    difficulty: "어려움",
    tip: "물과 햇빛, 바람을 아주 많이 필요로 합니다. 흙이 마르기 직전에 물을 주어야 하며 통풍이 필수입니다."
  },
  {
    name: "로즈마리",
    scientificName: "Salvia rosmarinus",
    waterPeriod: 5,
    light: "양지 (햇빛 가득)",
    difficulty: "보통",
    tip: "과습을 싫어하지만 물때를 놓치면 금방 마릅니다. 햇빛이 잘 들고 통풍이 아주 잘 되는 곳에 두세요."
  },
  {
    name: "금전수 (돈나무)",
    scientificName: "Zamioculcas zamiifolia",
    waterPeriod: 20,
    light: "반음지",
    difficulty: "아주 쉬움",
    tip: "잎과 줄기에 물을 머금고 있어 물을 자주 주면 뿌리가 썩습니다. 흙이 완전히 말랐을 때 흠뻑 줍니다."
  },
  {
    name: "행운목",
    scientificName: "Dracaena fragrans",
    waterPeriod: 10,
    light: "반음지",
    difficulty: "쉬움",
    tip: "흙이 마르면 물을 주며, 수경재배 시에는 물이 탁해지기 전에 자주 갈아주는 것이 좋습니다."
  },
  {
    name: "싱고니움",
    scientificName: "Syngonium podophyllum",
    waterPeriod: 7,
    light: "반음지",
    difficulty: "쉬움",
    tip: "고온다습한 환경을 좋아합니다. 겉흙이 마르면 물을 흠뻑 주고 공중 분무를 자주 해주세요."
  },
  {
    name: "고무나무 (인도/멜라니)",
    scientificName: "Ficus elastica",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "쉬움",
    tip: "빛이 잘 드는 곳에서 겉흙이 바짝 마르면 물을 줍니다. 잎에 쌓인 먼지를 젖은 천으로 닦아주면 좋습니다."
  },
  {
    name: "보스턴고사리",
    scientificName: "Nephrolepis exaltata",
    waterPeriod: 4,
    light: "반음지",
    difficulty: "보통",
    tip: "습한 환경을 좋아하므로 흙을 촉촉하게 유지하고 잎에 매일 분무를 해 주는 것이 좋습니다."
  },
  {
    name: "크루시아",
    scientificName: "Clusia rosea",
    waterPeriod: 15,
    light: "반양지",
    difficulty: "쉬움",
    tip: "도톰한 잎에 수분을 저장하므로 겉흙이 마르고 2~3일 후에 물을 주어도 끄떡없습니다."
  },
  {
    name: "스파티필름",
    scientificName: "Spathiphyllum",
    waterPeriod: 6,
    light: "반음지",
    difficulty: "쉬움",
    tip: "물이 부족하면 잎이 아래로 눈에 띄게 처집니다. 이때 물을 주면 다시 싱싱하게 살아납니다."
  },
  {
    name: "율마",
    scientificName: "Cupressus macrocarpa",
    waterPeriod: 2,
    light: "양지 (햇빛 가득)",
    difficulty: "어려움",
    tip: "물 부족에 매우 민감하여 겉흙이 조금만 말라도 바로 흠뻑 줘야 합니다. 통풍과 직사광선이 필수입니다."
  },
  {
    name: "다육식물 (일반)",
    scientificName: "Succulent",
    waterPeriod: 15,
    light: "양지 (햇빛 가득)",
    difficulty: "쉬움",
    tip: "잎이 쪼글쪼글해 보일 때 물을 주는 것이 과습을 방지하는 가장 좋은 방법입니다."
  },
  {
    name: "선인장 (일반)",
    scientificName: "Cactaceae",
    waterPeriod: 30,
    light: "양지 (햇빛 가득)",
    difficulty: "아주 쉬움",
    tip: "겨울철에는 거의 물을 주지 않고 봄~가을에는 한 달에 한 번 줄기 상태를 보며 소량 물을 줍니다."
  },
  {
    name: "개운죽",
    scientificName: "Dracaena sanderiana",
    waterPeriod: 7,
    light: "음지/반음지",
    difficulty: "아주 쉬움",
    tip: "수경재배 시 1~2주에 한 번 물을 갈아줍니다. 흙에서 키울 때는 흙이 마르지 않게 관리합니다."
  },
  {
    name: "피토니아 (화이트스타)",
    scientificName: "Fittonia albivenis",
    waterPeriod: 4,
    light: "반음지",
    difficulty: "보통",
    tip: "습도가 높은 음지 계곡에서 자라던 식물로 건조하면 잎이 쳐집니다. 잦은 공중 분무가 도움이 됩니다."
  },
  {
    name: "마리모 (모스볼)",
    scientificName: "Aegagropila linnaei",
    waterPeriod: 7,
    light: "음지/반음지",
    difficulty: "아주 쉬움",
    tip: "일주일에 한 번 찬물로 전체 물을 갈아줍니다. 더울 때는 냉장고에 잠시 넣어 시원하게 해주세요."
  },
  {
    name: "제라늄",
    scientificName: "Pelargonium",
    waterPeriod: 7,
    light: "양지 (햇빛 가득)",
    difficulty: "보통",
    tip: "건조에 강하므로 흙이 속까지 거의 말랐을 때 물을 흠뻑 줍니다. 꽃잎에는 물이 닿지 않게 하세요."
  },
  {
    name: "필레아 페페 (다산나무)",
    scientificName: "Pilea peperomioides",
    waterPeriod: 8,
    light: "반양지",
    difficulty: "쉬움",
    tip: "동글동글한 잎이 매력적입니다. 흙이 말라 잎이 살짝 힘이 없어질 때 물을 흠뻑 줍니다."
  },
  {
    name: "틸란드시아 (이오난사)",
    scientificName: "Tillandsia ionantha",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "쉬움",
    tip: "흙 없이 공기 중 수분을 먹고 자랍니다. 일주일에 1~2번 분무하거나, 열흘에 한 번 물에 1시간 담가둡니다."
  },
  {
    name: "안스리움",
    scientificName: "Anthurium andraeanum",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "보통",
    tip: "일 년 내내 꽃(불염포)을 볼 수 있습니다. 과습에 주의하며 겉흙이 말랐을 때 물을 줍니다."
  },
  {
    name: "호접란 (팔레놉시스)",
    scientificName: "Phalaenopsis",
    waterPeriod: 12,
    light: "반양지",
    difficulty: "보통",
    tip: "식재(바크, 수태)가 바짝 말랐을 때 대야에 물을 받아 20~30분간 담가두는 저면관수법이 좋습니다."
  },
  {
    name: "아이비",
    scientificName: "Hedera helix",
    waterPeriod: 7,
    light: "반음지",
    difficulty: "쉬움",
    tip: "덩굴성으로 잘 자라며 건조와 과습 모두에 강한 편입니다. 겉흙이 마르면 물을 줍니다."
  },
  {
    name: "벤자민고무나무",
    scientificName: "Ficus benjamina",
    waterPeriod: 8,
    light: "반양지",
    difficulty: "보통",
    tip: "환경 변화에 민감하여 자리를 자주 옮기면 잎을 떨어뜨립니다. 겉흙이 마르면 흠뻑 줍니다."
  },
  {
    name: "올리브나무",
    scientificName: "Olea europaea",
    waterPeriod: 7,
    light: "양지 (햇빛 가득)",
    difficulty: "보통",
    tip: "건조함에는 매우 강하지만 햇빛이 부족하면 자라지 못합니다. 흙을 건조하게 관리하되 마르면 듬뿍 줍니다."
  },
  {
    name: "게스네리아 (에피스시아)",
    scientificName: "Episcia cupreata",
    waterPeriod: 5,
    light: "반양지",
    difficulty: "보통",
    tip: "잎에 미세한 털이 있어 직접적인 잎 분무는 피하고 흙에 물을 줍니다. 고온다습한 환경을 좋아합니다."
  },
  {
    name: "커피나무",
    scientificName: "Coffea arabica",
    waterPeriod: 6,
    light: "반양지",
    difficulty: "보통",
    tip: "따뜻한 실내와 높은 습도를 좋아합니다. 겉흙이 건조해지면 물을 가득 흠뻑 줍니다."
  }
];
