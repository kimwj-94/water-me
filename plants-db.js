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
  },
  {
    name: "필로덴드론 버킨",
    scientificName: "Philodendron Birkin",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "쉬움",
    tip: "겉흙이 마르면 물을 주고 강한 직사광선은 피합니다. 잎 무늬 유지를 위해 밝은 간접광이 좋습니다."
  },
  {
    name: "필로덴드론 셀렘",
    scientificName: "Thaumatophyllum bipinnatifidum",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "쉬움",
    tip: "큰 잎이 넓게 퍼지므로 통풍이 잘 되는 밝은 곳에 두고 겉흙이 마르면 충분히 물을 줍니다."
  },
  {
    name: "알로카시아",
    scientificName: "Alocasia",
    waterPeriod: 6,
    light: "반양지",
    difficulty: "보통",
    tip: "과습과 냉해에 약합니다. 흙 표면이 마른 뒤 물을 주고 겨울에는 주기를 길게 잡으세요."
  },
  {
    name: "칼라데아 오르비폴리아",
    scientificName: "Calathea orbifolia",
    waterPeriod: 5,
    light: "반음지",
    difficulty: "어려움",
    tip: "건조한 공기에 약해 잎끝이 마르기 쉽습니다. 흙을 살짝 촉촉하게 유지하고 습도를 높여주세요."
  },
  {
    name: "칼라데아 마코야나",
    scientificName: "Calathea makoyana",
    waterPeriod: 5,
    light: "반음지",
    difficulty: "어려움",
    tip: "직사광선을 피하고 높은 습도를 유지합니다. 수돗물 염소에 민감할 수 있어 받아둔 물이 좋습니다."
  },
  {
    name: "마란타",
    scientificName: "Maranta leuconeura",
    waterPeriod: 5,
    light: "반음지",
    difficulty: "보통",
    tip: "기도 식물로 불리며 습한 환경을 좋아합니다. 겉흙이 마르기 전에 물을 주되 고인 물은 피하세요."
  },
  {
    name: "디펜바키아",
    scientificName: "Dieffenbachia",
    waterPeriod: 7,
    light: "반음지/반양지",
    difficulty: "쉬움",
    tip: "밝은 간접광에서 잘 자랍니다. 과습하면 줄기가 무를 수 있어 흙 표면이 마른 뒤 물을 주세요."
  },
  {
    name: "드라세나 마지나타",
    scientificName: "Dracaena marginata",
    waterPeriod: 12,
    light: "반음지",
    difficulty: "쉬움",
    tip: "건조에 강한 편입니다. 흙이 충분히 마른 뒤 물을 주고 겨울에는 물주기를 줄입니다."
  },
  {
    name: "파키라",
    scientificName: "Pachira aquatica",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "쉬움",
    tip: "줄기에 수분을 저장하므로 과습을 피합니다. 밝은 곳에서 흙이 마르면 듬뿍 물을 주세요."
  },
  {
    name: "무늬벤자민",
    scientificName: "Ficus benjamina variegata",
    waterPeriod: 8,
    light: "반양지",
    difficulty: "보통",
    tip: "환경 변화에 민감합니다. 위치를 자주 바꾸지 말고 밝은 간접광에서 일정한 물주기를 유지하세요."
  },
  {
    name: "떡갈고무나무",
    scientificName: "Ficus lyrata",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "보통",
    tip: "큰 잎에 먼지가 쌓이면 닦아주세요. 흙이 마른 뒤 물을 주고 찬바람은 피합니다."
  },
  {
    name: "녹보수",
    scientificName: "Radermachera sinica",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "쉬움",
    tip: "밝고 통풍이 좋은 곳을 좋아합니다. 겉흙이 마르면 물을 주고 겨울에는 주기를 늘립니다."
  },
  {
    name: "해피트리",
    scientificName: "Heteropanax fragrans",
    waterPeriod: 7,
    light: "반양지",
    difficulty: "쉬움",
    tip: "실내 관엽수로 키우기 쉽습니다. 겉흙이 마르면 충분히 물을 주고 통풍을 신경 써 주세요."
  },
  {
    name: "뱅갈고무나무",
    scientificName: "Ficus benghalensis",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "쉬움",
    tip: "밝은 곳에서 잎색이 선명합니다. 흙이 마른 뒤 물을 주고 과습을 피하세요."
  },
  {
    name: "소철",
    scientificName: "Cycas revoluta",
    waterPeriod: 15,
    light: "양지/반양지",
    difficulty: "쉬움",
    tip: "건조에 강하고 과습에 약합니다. 햇빛이 잘 드는 곳에서 흙이 충분히 마른 뒤 물을 주세요."
  },
  {
    name: "문샤인 산세베리아",
    scientificName: "Sansevieria trifasciata Moonshine",
    waterPeriod: 25,
    light: "반음지",
    difficulty: "아주 쉬움",
    tip: "일반 산세베리아처럼 과습을 피합니다. 은빛 잎색을 유지하려면 너무 어둡지 않은 곳이 좋습니다."
  },
  {
    name: "아글라오네마",
    scientificName: "Aglaonema",
    waterPeriod: 8,
    light: "반음지",
    difficulty: "쉬움",
    tip: "어두운 실내에도 비교적 강합니다. 흙 표면이 마르면 물을 주고 찬 공기는 피하세요."
  },
  {
    name: "페페로미아",
    scientificName: "Peperomia",
    waterPeriod: 10,
    light: "반양지",
    difficulty: "쉬움",
    tip: "잎에 수분이 많아 과습에 약합니다. 흙이 마른 뒤 소량씩 물을 주는 편이 안전합니다."
  },
  {
    name: "호야",
    scientificName: "Hoya carnosa",
    waterPeriod: 12,
    light: "반양지",
    difficulty: "쉬움",
    tip: "두꺼운 잎이 수분을 저장합니다. 밝은 간접광에서 키우고 흙이 충분히 마르면 물을 주세요."
  },
  {
    name: "립살리스",
    scientificName: "Rhipsalis",
    waterPeriod: 10,
    light: "반음지/반양지",
    difficulty: "쉬움",
    tip: "숲속 착생 선인장이라 강한 직사광선보다 밝은 간접광이 좋습니다. 흙이 마르면 물을 주세요."
  }
];

// 보조 도감: 자동완성과 기본 주기 추천을 넓히기 위한 실내/베란다 식물 목록입니다.
// 품종별 환경 차이가 크므로 앱 등록 시 사용자가 실제 집 환경에 맞게 주기를 조정하는 것을 전제로 합니다.
const supplementalPlantNames = [
  "알로카시아 아마조니카", "알로카시아 프라이덱", "알로카시아 오도라", "알로카시아 블랙벨벳", "알로카시아 쿠프레아",
  "필로덴드론 버킨", "필로덴드론 셀렘", "필로덴드론 글로리오섬", "필로덴드론 미칸", "필로덴드론 핑크프린세스",
  "필로덴드론 화이트프린세스", "필로덴드론 브랜티아넘", "필로덴드론 버럴막스", "필로덴드론 실버메탈", "필로덴드론 플로리다뷰티",
  "칼라데아 오르비폴리아", "칼라데아 마코야나", "칼라데아 메달리온", "칼라데아 로제오픽타", "칼라데아 퓨전화이트",
  "칼라데아 루피바르바", "칼라데아 란시폴리아", "칼라데아 도티", "칼라데아 와르세비치", "칼라데아 제브리나",
  "마란타 레우코네우라", "마란타 레몬라임", "마란타 케르코비아나", "크테난테 버레막시아나", "크테난테 오펜하이미아나",
  "스트로만테 트리오스타", "스트로만테 매직스타", "디펜바키아 카밀라", "디펜바키아 트로픽스노우", "디펜바키아 마리안느",
  "아글라오네마 스노우사파이어", "아글라오네마 실버퀸", "아글라오네마 레드발렌타인", "아글라오네마 지리홍", "아글라오네마 엔젤",
  "드라세나 마지나타", "드라세나 콤팩타", "드라세나 송오브인디아", "드라세나 송오브자메이카", "드라세나 레몬라임",
  "드라세나 마상게아나", "드라세나 와네키", "드라세나 고드세피아나", "유카", "파키라",
  "셰플레라 홍콩야자 무늬종", "셰플레라 아마테", "폴리시아스", "아라우카리아", "아라우카리아 노포크",
  "벤자민고무나무", "벤자민 스타라이트", "벤자민 바로크", "인삼벤자민", "무화과나무",
  "올리브나무", "레몬나무", "금귤나무", "라임나무", "커피나무",
  "바질", "스위트바질", "애플민트", "페퍼민트", "스피어민트",
  "타임", "레몬밤", "오레가노", "파슬리", "고수",
  "딜", "라벤더", "장미허브", "센티드제라늄", "애플제라늄",
  "아이비제라늄", "리갈제라늄", "칼랑코에", "칼랑코에 칼란디바", "장미베고니아",
  "렉스베고니아", "엔젤윙베고니아", "목베고니아", "사철베고니아", "구근베고니아",
  "아프리칸바이올렛", "시클라멘", "프리뮬라", "포인세티아", "히아신스",
  "수선화", "튤립", "아마릴리스", "크로커스", "무스카리",
  "제라늄 로즈버드", "국화", "미니장미", "수국", "치자나무",
  "자스민", "마삭줄", "풍차자스민", "부겐빌레아", "캄파눌라",
  "안개꽃", "페튜니아", "팬지", "비올라", "채송화",
  "천일홍", "메리골드", "금어초", "라넌큘러스", "데이지",
  "아이비", "무늬아이비", "하트아이비", "러브체인", "디시디아",
  "디시디아 밀리언하트", "디시디아 오바타", "필레아 글라우카", "필레아 카디에레이", "필레아 인볼루크라타",
  "트라데스칸티아 제브리나", "트라데스칸티아 나노크", "트라데스칸티아 스파타세아", "트라데스칸티아 플루미넨시스", "콜레우스",
  "폴카닷플랜트", "이레신", "피토니아 레드", "피토니아 핑크", "피토니아 그린",
  "싱고니움 화이트버터플라이", "싱고니움 핑크스팟", "싱고니움 밀크컨페티", "싱고니움 알보", "싱고니움 네온",
  "스킨답서스 엔조이", "스킨답서스 마블퀸", "스킨답서스 골든", "스킨답서스 실버", "스킨답서스 트레비",
  "에피프렘넘 피나텀", "세부블루", "몬스테라 아단소니", "몬스테라 스탠들리아나", "몬스테라 두비아",
  "몬스테라 알보", "몬스테라 타이컨스텔레이션", "라피도포라 테트라스퍼마", "라피도포라 디커시바", "스킨답서스 픽투스",
  "스킨답서스 실버레이디", "스킨답서스 아르지리우스", "호야 케리", "호야 리네아리스", "호야 오보바타",
  "호야 푸비칼릭스", "호야 라쿠노사", "호야 마틸다", "호야 카노사 컴팩타", "호야 커티시",
  "페페로미아 오브투시폴리아", "페페로미아 아르지레이아", "페페로미아 로쏘", "페페로미아 호프", "페페로미아 프로스트라타",
  "페페로미아 글라벨라", "페페로미아 라나베르데", "페페로미아 루비글로우", "피쉬본선인장", "게발선인장",
  "공작선인장", "만세선인장", "백도선", "금호선인장", "귀면각",
  "용신목", "연필선인장", "유포르비아 트리고나", "유포르비아 밀리", "유포르비아 다이아몬드프로스트",
  "알로에 베라", "알로에 아리스타타", "하월시아", "하월시아 옵투사", "하월시아 쿠페리",
  "에케베리아", "에케베리아 라우이", "에케베리아 릴리시나", "에케베리아 블랙프린스", "세덤",
  "세덤 모건니아눔", "세덤 루브로틴툼", "그라프토페탈룸", "그라프토베리아", "파키피툼",
  "리톱스", "코노피튬", "아드로미스쿠스", "크라슐라 오바타", "염좌",
  "우주목", "청옥", "프리티", "홍옥", "흑법사",
  "아에오니움", "칼랑코에 토멘토사", "월토이", "십이지권", "괴마옥",
  "스투키 실린드리카", "산세베리아 로렌티", "산세베리아 하니", "산세베리아 골든하니", "산세베리아 블랙드래곤",
  "틸란드시아 스트릭타", "틸란드시아 키아네아", "틸란드시아 불보사", "틸란드시아 준세아", "틸란드시아 세로그라피카",
  "네오레겔리아", "브로멜리아드", "구즈마니아", "브리에세아", "에크메아",
  "보스턴고사리 더피", "아디안텀", "아스플레니움", "박쥐란", "블루스타펀",
  "후마타고사리", "넉줄고사리", "프테리스", "실버레이디고사리", "더피고사리",
  "스파티필름 도미노", "스파티필름 센세이션", "안스리움 클라리네비움", "안스리움 크리스탈리넘", "안스리움 비타리폴리움",
  "호접란 미니", "덴드로비움", "온시디움", "카틀레야", "심비디움",
  "파피오페딜룸", "바닐라오키드", "네펜데스", "파리지옥", "끈끈이주걱",
  "사라세니아", "벌레잡이제비꽃", "무늬접란", "접란", "나비란",
  "차이브", "워터코인", "아이비고사리", "레드스타", "코르딜리네",
  "크로톤", "크로톤 페트라", "코르딜리네 레드엣지", "아비스", "슈가바인",
  "무늬벤자민", "황칠나무", "팔손이", "무늬팔손이", "남천",
  "천냥금", "백량금", "만냥금", "율마 골드크레스트", "측백나무",
  "로즈마리 토스카나블루", "로즈마리 프로스트라투스", "유칼립투스 구니", "유칼립투스 폴리안", "유칼립투스 블랙잭",
  "올리브 미션", "올리브 아르베키나", "블루베리", "라즈베리", "딸기",
  "방울토마토", "고추", "상추", "루꼴라", "케일",
  "청경채", "쪽파", "대파", "미나리", "고구마순"
];

function buildSupplementalEntry(name) {
  const lower = name.toLowerCase();
  const dryKeywords = ["선인장", "다육", "산세베리아", "스투키", "틸란드시아", "하월시아", "에케베리아", "세덤", "리톱스", "알로에", "유포르비아", "호야", "페페로미아"];
  const moistureKeywords = ["고사리", "칼라데아", "마란타", "크테난테", "스트로만테", "피토니아", "네펜데스", "끈끈이", "파리지옥", "워터코인", "미나리"];
  const sunKeywords = ["허브", "바질", "로즈마리", "라벤더", "민트", "올리브", "유칼립투스", "레몬", "라임", "금귤", "토마토", "고추", "상추", "루꼴라", "케일", "청경채", "쪽파", "대파", "딸기", "블루베리"];

  const isDry = dryKeywords.some(keyword => lower.includes(keyword.toLowerCase()));
  const isMoist = moistureKeywords.some(keyword => lower.includes(keyword.toLowerCase()));
  const wantsSun = sunKeywords.some(keyword => lower.includes(keyword.toLowerCase()));

  return {
    name,
    scientificName: "",
    waterPeriod: isDry ? 18 : (isMoist ? 4 : 8),
    light: wantsSun ? "양지/반양지" : (isMoist ? "반음지/반양지" : "반양지"),
    difficulty: isDry ? "쉬움" : (isMoist ? "보통" : "쉬움"),
    tip: isDry
      ? "건조에 강한 편이므로 흙이 충분히 마른 뒤 물을 주세요. 과습을 특히 조심합니다."
      : (isMoist
        ? "건조하면 잎이 쉽게 처질 수 있습니다. 겉흙 상태를 자주 확인하고 통풍을 함께 챙겨 주세요."
        : "밝은 간접광에서 키우고 겉흙이 마르면 물을 주세요. 계절과 실내 환경에 맞춰 주기를 조정합니다.")
  };
}

const existingPlantNames = new Set(window.plantDatabase.map(plant => plant.name));
const supplementalEntries = supplementalPlantNames
  .filter(name => !existingPlantNames.has(name))
  .slice(0, Math.max(0, 300 - window.plantDatabase.length))
  .map(buildSupplementalEntry);

window.plantDatabase = window.plantDatabase.concat(supplementalEntries);
