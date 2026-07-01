export type Locale =
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ko"
  | "id"
  | "th"
  | "vi"
  | "km"
  | "lo"
  | "ms"
  | "my"
  | "tet";

export interface Dictionary {
  locale: Locale;
  label: string;
  strings: {
    nextDepartures: string;
    seatsAvailable: string;
    seatsFilled: string;
    whatsappBanner: string;
    boarding: string;
    enRoute: string;
    scheduled: string;
    delayed: string;
    completed: string;
    noTripsAvailable: string;
    headcount: string;
    addPassenger: string;
    removePassenger: string;
    sosEscalation: string;
    fleetDashboard: string;
    addAdhocBus: string;
    bulkShiftSchedule: string;
    signageMode: string;
    departing: string;
    arriving: string;
    status: string;
    capacity: string;
    from: string;
    to: string;
    transportSchedule: string;
    conferenceSchedule: string;
    filterByHotel: string;
    allLocations: string;
    quickGuide: string;
    loQuickGuide: string;
    programmePending: string;
    guideAutoRefresh: string;
    guideHotelFilter: string;
    guideBusFull: string;
    guideWhatsApp: string;
    guideLanguage: string;
    guideLoIncrement: string;
    guideLoTypeCount: string;
    guideLoSlider: string;
    guideLoSos: string;
    guideLoOffline: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    locale: "en",
    label: "English",
    strings: {
      nextDepartures: "Next Departures",
      seatsAvailable: "seats available",
      seatsFilled: "of seats filled",
      whatsappBanner: "Receive Live Updates via WhatsApp",
      boarding: "Boarding",
      enRoute: "En Route",
      scheduled: "Scheduled",
      delayed: "Delayed",
      completed: "Completed",
      noTripsAvailable: "No trips currently available",
      headcount: "Headcount",
      addPassenger: "Add Passenger",
      removePassenger: "Remove Passenger",
      sosEscalation: "SOS / Escalation",
      fleetDashboard: "Fleet Dashboard",
      addAdhocBus: "Add Ad-Hoc Bus",
      bulkShiftSchedule: "Bulk Shift Schedule",
      signageMode: "Signage Mode",
      departing: "Departing",
      arriving: "Arriving",
      status: "Status",
      capacity: "Capacity",
      from: "From",
      to: "To",
      transportSchedule: "Transport Schedule",
      conferenceSchedule: "Conference Schedule",
      filterByHotel: "Filter by hotel / location",
      allLocations: "All locations",
      quickGuide: "Quick Guide",
      loQuickGuide: "LO Quick Guide",
      programmePending:
        "Full programme details will be distributed at registration.",
      guideAutoRefresh: "This page refreshes automatically every 4 seconds.",
      guideHotelFilter:
        "Use the hotel filter to see only buses at your location.",
      guideBusFull:
        "A red 'Full' badge means no seats remain. Check for a later departure.",
      guideWhatsApp:
        "Tap the WhatsApp banner to join the live transport updates group.",
      guideLanguage: "Use the globe icon to switch the display language.",
      guideLoIncrement:
        "Tap + or - to adjust the passenger count one at a time.",
      guideLoTypeCount:
        "Tap the large number to type the exact count directly.",
      guideLoSlider: "Drag the slider for quick coarse adjustments.",
      guideLoSos:
        "Press SOS only in a genuine emergency. You will be asked for a brief description.",
      guideLoOffline:
        "No signal? Changes are saved locally and sync automatically when you reconnect.",
    },
  },
  "zh-CN": {
    locale: "zh-CN",
    label: "简体中文",
    strings: {
      nextDepartures: "下次出发",
      seatsAvailable: "可用座位",
      seatsFilled: "座位已满",
      whatsappBanner: "通过WhatsApp接收实时更新",
      boarding: "登车中",
      enRoute: "途中",
      scheduled: "已排定",
      delayed: "延误",
      completed: "已完成",
      noTripsAvailable: "目前没有可用行程",
      headcount: "人数",
      addPassenger: "添加乘客",
      removePassenger: "移除乘客",
      sosEscalation: "紧急呼叫",
      fleetDashboard: "车队仪表板",
      addAdhocBus: "添加临时巴士",
      bulkShiftSchedule: "批量调整时间表",
      signageMode: "标牌模式",
      departing: "出发",
      arriving: "到达",
      status: "状态",
      capacity: "容量",
      from: "出发地",
      to: "目的地",
      transportSchedule: "交通时刻表",
      conferenceSchedule: "会议日程",
      filterByHotel: "按酒店/地点筛选",
      allLocations: "所有地点",
      quickGuide: "使用指南",
      loQuickGuide: "联络官指南",
      programmePending: "详细议程将在报到时发放。",
      guideAutoRefresh: "本页面每4秒自动刷新。",
      guideHotelFilter: "使用酒店筛选，仅查看您所在位置的巴士。",
      guideBusFull: "红色「满」标志表示无空余座位，请查看其他班次。",
      guideWhatsApp: "点击WhatsApp横幅加入实时交通更新群组。",
      guideLanguage: "使用地球图标切换显示语言。",
      guideLoIncrement: "点击+或-逐一调整乘客数量。",
      guideLoTypeCount: "点击大数字可直接输入精确人数。",
      guideLoSlider: "拖动滑块可快速粗略调整。",
      guideLoSos: "仅在真正紧急情况下按SOS。系统会要求您简要描述情况。",
      guideLoOffline: "无信号？更改将本地保存，恢复连接后自动同步。",
    },
  },
  "zh-TW": {
    locale: "zh-TW",
    label: "繁體中文",
    strings: {
      nextDepartures: "下次出發",
      seatsAvailable: "可用座位",
      seatsFilled: "座位已滿",
      whatsappBanner: "透過WhatsApp接收即時更新",
      boarding: "登車中",
      enRoute: "途中",
      scheduled: "已排定",
      delayed: "延誤",
      completed: "已完成",
      noTripsAvailable: "目前沒有可用行程",
      headcount: "人數",
      addPassenger: "新增乘客",
      removePassenger: "移除乘客",
      sosEscalation: "緊急呼叫",
      fleetDashboard: "車隊儀表板",
      addAdhocBus: "新增臨時巴士",
      bulkShiftSchedule: "批量調整時間表",
      signageMode: "標牌模式",
      departing: "出發",
      arriving: "到達",
      status: "狀態",
      capacity: "容量",
      from: "出發地",
      to: "目的地",
      transportSchedule: "交通時刻表",
      conferenceSchedule: "會議日程",
      filterByHotel: "按酒店/地點篩選",
      allLocations: "所有地點",
      quickGuide: "使用指南",
      loQuickGuide: "聯絡官指南",
      programmePending: "詳細議程將在報到時發放。",
      guideAutoRefresh: "本頁面每4秒自動更新。",
      guideHotelFilter: "使用酒店篩選，僅查看您所在位置的巴士。",
      guideBusFull: "紅色「滿」標示表示無空位，請查看其他班次。",
      guideWhatsApp: "點擊WhatsApp橫幅加入即時交通更新群組。",
      guideLanguage: "使用地球圖示切換顯示語言。",
      guideLoIncrement: "點擊+或-逐一調整乘客數量。",
      guideLoTypeCount: "點擊大數字可直接輸入精確人數。",
      guideLoSlider: "拖動滑塊可快速粗略調整。",
      guideLoSos: "僅在真正緊急情況下按SOS。系統會要求您簡述情況。",
      guideLoOffline: "無訊號？更改將本地儲存，恢復連線後自動同步。",
    },
  },
  ja: {
    locale: "ja",
    label: "日本語",
    strings: {
      nextDepartures: "次の出発",
      seatsAvailable: "空席あり",
      seatsFilled: "座席使用中",
      whatsappBanner: "WhatsAppでライブ更新を受信",
      boarding: "乗車中",
      enRoute: "運行中",
      scheduled: "予定",
      delayed: "遅延",
      completed: "完了",
      noTripsAvailable: "現在利用可能な便はありません",
      headcount: "乗客数",
      addPassenger: "乗客追加",
      removePassenger: "乗客削除",
      sosEscalation: "緊急通報",
      fleetDashboard: "車両ダッシュボード",
      addAdhocBus: "臨時バス追加",
      bulkShiftSchedule: "一括スケジュール変更",
      signageMode: "サイネージモード",
      departing: "出発",
      arriving: "到着",
      status: "状態",
      capacity: "定員",
      from: "乗車地",
      to: "降車地",
      transportSchedule: "交通スケジュール",
      conferenceSchedule: "会議スケジュール",
      filterByHotel: "ホテル・場所で絞り込む",
      allLocations: "すべての場所",
      quickGuide: "クイックガイド",
      loQuickGuide: "LOクイックガイド",
      programmePending: "詳細プログラムは受付時に配布されます。",
      guideAutoRefresh: "このページは4秒ごとに自動更新されます。",
      guideHotelFilter:
        "ホテルフィルターを使って、お近くのバスのみを表示できます。",
      guideBusFull:
        "赤い「満席」バッジは空席がないことを意味します。後のバスをご確認ください。",
      guideWhatsApp:
        "WhatsAppバナーをタップしてライブ交通更新グループに参加してください。",
      guideLanguage: "地球アイコンを使って表示言語を切り替えてください。",
      guideLoIncrement:
        "+または-をタップして乗客数を一人ずつ調整してください。",
      guideLoTypeCount: "大きな数字をタップして正確な人数を直接入力できます。",
      guideLoSlider: "スライダーをドラッグして素早く大まかな調整ができます。",
      guideLoSos:
        "本当の緊急時にのみSOSを押してください。簡単な説明を求められます。",
      guideLoOffline:
        "圈外？変更はローカルに保存され、再接続時に自動同期されます。",
    },
  },
  ko: {
    locale: "ko",
    label: "한국어",
    strings: {
      nextDepartures: "다음 출발",
      seatsAvailable: "좌석 이용 가능",
      seatsFilled: "좌석 사용 중",
      whatsappBanner: "WhatsApp으로 실시간 업데이트 수신",
      boarding: "탑승 중",
      enRoute: "운행 중",
      scheduled: "예정",
      delayed: "지연",
      completed: "완료",
      noTripsAvailable: "현재 이용 가능한 운행이 없습니다",
      headcount: "승객 수",
      addPassenger: "승객 추가",
      removePassenger: "승객 제거",
      sosEscalation: "긴급 호출",
      fleetDashboard: "차량 대시보드",
      addAdhocBus: "임시 버스 추가",
      bulkShiftSchedule: "일괄 일정 변경",
      signageMode: "사이니지 모드",
      departing: "출발",
      arriving: "도착",
      status: "상태",
      capacity: "정원",
      from: "출발지",
      to: "목적지",
      transportSchedule: "교통 일정",
      conferenceSchedule: "회의 일정",
      filterByHotel: "호텔 / 위치별 필터",
      allLocations: "모든 위치",
      quickGuide: "빠른 안내",
      loQuickGuide: "LO 빠른 안내",
      programmePending: "전체 프로그램 정보는 등록 시 배포됩니다.",
      guideAutoRefresh: "이 페이지는 4초마다 자동으로 새로고침됩니다.",
      guideHotelFilter: "호텔 필터를 사용해 내 위치의 버스만 확인하세요.",
      guideBusFull:
        "빨간 '만석' 표시는 남은 자리가 없다는 의미입니다. 이후 출발 편을 확인하세요.",
      guideWhatsApp:
        "WhatsApp 배너를 탭하여 실시간 교통 업데이트 그룹에 참가하세요.",
      guideLanguage: "지구본 아이콘을 사용하여 표시 언어를 변경하세요.",
      guideLoIncrement: "+또는 -를 탭하여 승객 수를 하나씩 조정하세요.",
      guideLoTypeCount: "큰 숫자를 탭하면 정확한 수를 직접 입력할 수 있습니다.",
      guideLoSlider: "슬라이더를 드래그하여 빠르게 대략적으로 조정하세요.",
      guideLoSos:
        "실제 응급 상황에서만 SOS를 누르세요. 간단한 설명을 입력하도록 요청됩니다.",
      guideLoOffline:
        "신호 없음? 변경 사항은 로컈에 저장되며 재연결 시 자동으로 동기화됩니다.",
    },
  },
  id: {
    locale: "id",
    label: "Bahasa Indonesia",
    strings: {
      nextDepartures: "Keberangkatan Berikutnya",
      seatsAvailable: "kursi tersedia",
      seatsFilled: "kursi terisi",
      whatsappBanner: "Terima Pembaruan Langsung via WhatsApp",
      boarding: "Naik",
      enRoute: "Dalam Perjalanan",
      scheduled: "Dijadwalkan",
      delayed: "Tertunda",
      completed: "Selesai",
      noTripsAvailable: "Tidak ada perjalanan yang tersedia",
      headcount: "Jumlah Penumpang",
      addPassenger: "Tambah Penumpang",
      removePassenger: "Hapus Penumpang",
      sosEscalation: "SOS / Eskalasi",
      fleetDashboard: "Dasbor Armada",
      addAdhocBus: "Tambah Bus Ad-Hoc",
      bulkShiftSchedule: "Perubahan Jadwal Massal",
      signageMode: "Mode Papan Informasi",
      departing: "Berangkat",
      arriving: "Tiba",
      status: "Status",
      capacity: "Kapasitas",
      from: "Dari",
      to: "Ke",
      transportSchedule: "Jadwal Transportasi",
      conferenceSchedule: "Jadwal Konferensi",
      filterByHotel: "Filter berdasarkan hotel / lokasi",
      allLocations: "Semua lokasi",
      quickGuide: "Panduan Singkat",
      loQuickGuide: "Panduan LO",
      programmePending:
        "Detail program lengkap akan dibagikan saat pendaftaran.",
      guideAutoRefresh: "Halaman ini diperbarui otomatis setiap 4 detik.",
      guideHotelFilter:
        "Gunakan filter hotel untuk melihat bus di lokasi Anda saja.",
      guideBusFull:
        "Lencana merah 'Penuh' berarti tidak ada kursi tersisa. Cari keberangkatan berikutnya.",
      guideWhatsApp:
        "Ketuk banner WhatsApp untuk bergabung dengan grup pembaruan transportasi langsung.",
      guideLanguage: "Gunakan ikon globe untuk mengganti bahasa tampilan.",
      guideLoIncrement:
        "Ketuk + atau - untuk menyesuaikan jumlah penumpang satu per satu.",
      guideLoTypeCount:
        "Ketuk angka besar untuk mengetik jumlah yang tepat secara langsung.",
      guideLoSlider: "Geser slider untuk penyesuaian cepat.",
      guideLoSos:
        "Tekan SOS hanya dalam keadaan darurat yang sesungguhnya. Anda akan diminta memberikan deskripsi singkat.",
      guideLoOffline:
        "Tidak ada sinyal? Perubahan disimpan secara lokal dan disinkronkan otomatis saat terhubung kembali.",
    },
  },
  th: {
    locale: "th",
    label: "ภาษาไทย",
    strings: {
      nextDepartures: "รอบออกถัดไป",
      seatsAvailable: "ที่นั่งว่าง",
      seatsFilled: "ที่นั่งเต็ม",
      whatsappBanner: "รับอัปเดตสดผ่าน WhatsApp",
      boarding: "กำลังขึ้นรถ",
      enRoute: "กำลังเดินทาง",
      scheduled: "ตามกำหนด",
      delayed: "ล่าช้า",
      completed: "เสร็จสิ้น",
      noTripsAvailable: "ไม่มีรอบให้บริการในขณะนี้",
      headcount: "จำนวนผู้โดยสาร",
      addPassenger: "เพิ่มผู้โดยสาร",
      removePassenger: "ลบผู้โดยสาร",
      sosEscalation: "ฉุกเฉิน",
      fleetDashboard: "แดชบอร์ดรถ",
      addAdhocBus: "เพิ่มรถเสริม",
      bulkShiftSchedule: "เลื่อนตารางทั้งหมด",
      signageMode: "โหมดป้ายแสดง",
      departing: "ออก",
      arriving: "ถึง",
      status: "สถานะ",
      capacity: "ความจุ",
      from: "จาก",
      to: "ไป",
      transportSchedule: "ตารางรถรับส่ง",
      conferenceSchedule: "ตารางการประชุม",
      filterByHotel: "กรองตามโรงแรม / สถานที่",
      allLocations: "ทุกสถานที่",
      quickGuide: "คู่มือย่อ",
      loQuickGuide: "คู่มือ LO",
      programmePending: "รายละเอียดโปรแกรมฉบับเต็มจะแจกที่จุดลงทะเบียน",
      guideAutoRefresh: "หน้านี้จะรีเฟรชอัตโนมัติทุก 4 วินาที",
      guideHotelFilter: "ใช้ตัวกรองโรงแรมเพื่อดูเฉพาะรถที่บริการโรงแรมของคุณ",
      guideBusFull:
        "ป้ายสีแดง 'Full' หมายความว่าไม่มีที่นั่งเหลือ ดูรอบออกถัดไป",
      guideWhatsApp:
        "แตะแบนเนอร์ WhatsApp เพื่อเข้าร่วมกลุ่มอัพเดทการเดินทางสด",
      guideLanguage: "ใช้ไอคอนลูกโลกเพื่อเปลี่ยนภาษาที่แสดง",
      guideLoIncrement: "แตะ + หรือ - เพื่อปรับจำนวนผู้โดยสารทีละคน",
      guideLoTypeCount: "แตะตัวเลขขนาดใหญ่เพื่อพิมพ์จำนวนที่แน่นอนโดยตรง",
      guideLoSlider: "ลากแถบเลื่อนเพื่อปรับอย่างรวดเร็ว",
      guideLoSos:
        "กดปุ่ม SOS เฉพาะในกรณีฉุกเฉินจริง คุณจะถูกขอให้ระบุรายละเอียดสั้น ๆ",
      guideLoOffline:
        "ไม่มีสัญญาณ? การเปลี่ยนแปลงจะบันทึกในเครื่องและซิงค์อัตโนมัติเมื่อเชื่อมต่อใหม่",
    },
  },
  vi: {
    locale: "vi",
    label: "Tiếng Việt",
    strings: {
      nextDepartures: "Chuyến tiếp theo",
      seatsAvailable: "ghế trống",
      seatsFilled: "ghế đã đầy",
      whatsappBanner: "Nhận cập nhật trực tiếp qua WhatsApp",
      boarding: "Đang lên xe",
      enRoute: "Đang di chuyển",
      scheduled: "Theo lịch",
      delayed: "Trễ",
      completed: "Hoàn thành",
      noTripsAvailable: "Không có chuyến nào khả dụng",
      headcount: "Số hành khách",
      addPassenger: "Thêm hành khách",
      removePassenger: "Bớt hành khách",
      sosEscalation: "Khẩn cấp",
      fleetDashboard: "Bảng điều khiển xe",
      addAdhocBus: "Thêm xe đột xuất",
      bulkShiftSchedule: "Dời lịch hàng loạt",
      signageMode: "Chế độ bảng thông tin",
      departing: "Khởi hành",
      arriving: "Đến",
      status: "Trạng thái",
      capacity: "Sức chứa",
      from: "Từ",
      to: "Đến",
      transportSchedule: "Lịch xe đưa đón",
      conferenceSchedule: "Lịch hội nghị",
      filterByHotel: "Lọc theo khách sạn / địa điểm",
      allLocations: "Tất cả địa điểm",
      quickGuide: "Hướng dẫn nhanh",
      loQuickGuide: "Hướng dẫn LO",
      programmePending:
        "Chi tiết chương trình đầy đủ sẽ được phát tại bàn đăng ký.",
      guideAutoRefresh: "Trang này tự động cập nhật mỗi 4 giây.",
      guideHotelFilter:
        "Dùng bộ lọc khách sạn để chỉ xem xe tại vị trí của bạn.",
      guideBusFull:
        "Huy hiệu đỏ 'Full' có nghĩa là hết chỗ. Kiểm tra chuyến đi sau.",
      guideWhatsApp:
        "Nhấn vào banner WhatsApp để tham gia nhóm cập nhật giao thông trực tiếp.",
      guideLanguage:
        "Sử dụng biểu tượng địa cầu để thay đổi ngôn ngữ hiển thị.",
      guideLoIncrement:
        "Nhấn + hoặc - để điều chỉnh số hành khách từng người một.",
      guideLoTypeCount:
        "Nhấn vào con số lớn để nhập chính xác số lượng trực tiếp.",
      guideLoSlider: "Kéo thanh trượt để điều chỉnh nhanh.",
      guideLoSos:
        "Chỉ nhấn SOS trong tình huống khẩn cấp thực sự. Bạn sẽ được yêu cầu mô tả ngắn gọn.",
      guideLoOffline:
        "Mất tín hiệu? Thay đổi được lưu cục bộ và tự động đồng bộ khi kết nối lại.",
    },
  },
  km: {
    locale: "km",
    label: "ភាសាខ្មែរ",
    strings: {
      nextDepartures: "ការចេញដំណើរបន្ទាប់",
      seatsAvailable: "កៅអីទំនេរ",
      seatsFilled: "កៅអីពេញ",
      whatsappBanner: "ទទួលបានបច្ចុប្បន្នភាពផ្ទាល់តាម WhatsApp",
      boarding: "កំពុងឡើងរថយន្ត",
      enRoute: "កំពុងធ្វើដំណើរ",
      scheduled: "គ្រោងទុក",
      delayed: "ពន្យារ",
      completed: "បានបញ្ចប់",
      noTripsAvailable: "មិនមានដំណើរទេ",
      headcount: "ចំនួនអ្នកដំណើរ",
      addPassenger: "បន្ថែមអ្នកដំណើរ",
      removePassenger: "ដកអ្នកដំណើរ",
      sosEscalation: "សង្គ្រោះបន្ទាន់",
      fleetDashboard: "ផ្ទាំងគ្រប់គ្រងរថយន្ត",
      addAdhocBus: "បន្ថែមរថយន្តបន្ទាន់",
      bulkShiftSchedule: "ផ្លាស់ប្តូរកាលវិភាគ",
      signageMode: "របៀបផ្ទាំងព័ត៌មាន",
      departing: "ចេញដំណើរ",
      arriving: "មកដល់",
      status: "ស្ថានភាព",
      capacity: "សមត្ថភាព",
      from: "ពី",
      to: "ទៅ",
      transportSchedule: "កាលវិភាគដឹកជញ្ជូន",
      conferenceSchedule: "កាលវិភាគសន្និសីទ",
      filterByHotel: "ត្រងតាមសណ្ឋាគារ / ទីតាំង",
      allLocations: "ទីតាំងទាំងអស់",
      quickGuide: "មគ្គុទ្ទេសក៍រហ័ស",
      loQuickGuide: "មគ្គុទ្ទេសក៍ LO",
      programmePending: "ព័ត៌មានលម្អិតនឹងចែកនៅពេលចុះឈ្មោះ",
      guideAutoRefresh:
        "តាកវិភាគនេហធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវិឡវិនាទិ 4 វិនាទី",
      guideHotelFilter: "ប្រើបករណ៍ត្រងសណ្ឋាគារដើម្បីមើលតែរថយនតនៅតីតាំងរបស់អ្នក",
      guideBusFull:
        "ស្លាកក្រហម 'Full' មានន័យថាគ្មានកាវោីត្នេរ័ ស្វែងរករថ្រន់ស្នែលបន្តែក្រោយ",
      guideWhatsApp: "ចុចលើបដា WhatsApp ដើម្បីចូលរួមក្រុមត្វើរហ័សការដឹកជញ្ជូន",
      guideLanguage: "ប្រើរូបតំណាកភូមិភពលោកដើម្បីប័ត៌ប្តូរភាសា",
      guideLoIncrement: "ចុច + ប។ - ដើម្បីកែចំនួនអ្នកដឹម្ណារម្តាងមួយ",
      guideLoTypeCount: "ចុចលេខធាំដើម្បីវាយចំនួនដែលត្រឹមត្រូវ",
      guideLoSlider: "អូសសំដៅ slider ដើម្បីកែប្រែលេអន",
      guideLoSos:
        "ចុច SOS តែពេលមានករណីបន្តាន់ភិតប្រាក អ្នកនឹងត្រូវបានស្នើសុម្បីភ្នាសង្ខេប",
      guideLoOffline:
        "គ្មានសញ្ញា? ការផ្លាស់ប្តឡត្រូវបានរក្សាតុក ហើយធ្វើសមកាលកំមដោយស្វ័យប្រវិទ្តិ",
    },
  },
  lo: {
    locale: "lo",
    label: "ພາສາລາວ",
    strings: {
      nextDepartures: "ອອກເດີນທາງຕໍ່ໄປ",
      seatsAvailable: "ບ່ອນນັ່ງວ່າງ",
      seatsFilled: "ບ່ອນນັ່ງເຕັມ",
      whatsappBanner: "ຮັບການອັບເດດສົດຜ່ານ WhatsApp",
      boarding: "ກຳລັງຂຶ້ນລົດ",
      enRoute: "ກຳລັງເດີນທາງ",
      scheduled: "ຕາມກຳນົດ",
      delayed: "ຊ້າ",
      completed: "ສຳເລັດ",
      noTripsAvailable: "ບໍ່ມີຖ້ຽວໃຫ້ບໍລິການ",
      headcount: "ຈຳນວນຜູ້ໂດຍສານ",
      addPassenger: "ເພີ່ມຜູ້ໂດຍສານ",
      removePassenger: "ລຶບຜູ້ໂດຍສານ",
      sosEscalation: "ສຸກເສີນ",
      fleetDashboard: "ແຜງຄວບຄຸມລົດ",
      addAdhocBus: "ເພີ່ມລົດສຳຮອງ",
      bulkShiftSchedule: "ປ່ຽນຕາຕະລາງ",
      signageMode: "ໂໝດປ້າຍ",
      departing: "ອອກ",
      arriving: "ຮອດ",
      status: "ສະຖານະ",
      capacity: "ຄວາມຈຸ",
      from: "ຈາກ",
      to: "ໄປ",
      transportSchedule: "ຕາຕະລາງຂົນສົ່ງ",
      conferenceSchedule: "ຕາຕະລາງກອງປະຊຸມ",
      filterByHotel: "ກອງຕາມໂຮງແຮມ / ສະຖານທີ່",
      allLocations: "ທຸກສະຖານທີ່",
      quickGuide: "ຄູ່ມືດ່ວນ",
      loQuickGuide: "ຄູ່ມື LO",
      programmePending: "ລາຍລະອຽດໂຄງການຈະແຈກຢາຍເວລາລົງທະບຽນ",
      guideAutoRefresh: "ໜ້ານີ້ໂຫລດໃຫມ່ອັດຕະໂນມັດທຸກ 4 ວິນາທີ",
      guideHotelFilter: "ໃຊ້ຕັວກອງໂຮງແຮມເພື່ອເບິ່ງລົດສະເພາະທີ່ສະຖານທີ່ຂອງທ່ານ",
      guideBusFull:
        "ສັນຍາສີແດງ 'Full' ຫມາຍຄວາມວ່າບໍ່ມີທີ່ນັ່ງ. ກວດເບິ່ງຖ້ຽວອອກຖັດໄປ",
      guideWhatsApp:
        "ກົດທີ່ banner WhatsApp ເພື່ອເຂົ້າຮ່ວມກຸ່ມອັບເດດການຂົນສົ່ງ",
      guideLanguage: "ໃຊ້ໄອຄອນໂລກເພື່ອປ່ນພາສາສະແດງ",
      guideLoIncrement: "ກົດ + ຫຼື - ເພື່ອດັດແປງຈຳນວນຜູ້ໂດຍສານທີລະຄົນ",
      guideLoTypeCount: "ກົດໂຕເລກໃຫຍ່ເພື່ອພິມຈຳນວນທີ່ຊັດເຈນໂດຍກົງ",
      guideLoSlider: "ລາກ slider ເພື່ອດັດແປງໄວ",
      guideLoSos: "ກົດ SOS ສະເພາະໃນກໍລະນີສຸກເສີນຈິງ. ທ່ານຈະຖືກຂົໃຫ້ອະທິບາຍຫຍໍ້",
      guideLoOffline: "ບໍ່ມີສັນຍານ? ການປ່ນແປງຖືກບັນທຶກ ແລະ ຊິງໂຄໂດຍອັດຕະໂນມັດ",
    },
  },
  ms: {
    locale: "ms",
    label: "Bahasa Melayu",
    strings: {
      nextDepartures: "Perlepasan Seterusnya",
      seatsAvailable: "tempat duduk tersedia",
      seatsFilled: "tempat duduk penuh",
      whatsappBanner: "Terima Kemas Kini Langsung melalui WhatsApp",
      boarding: "Menaiki",
      enRoute: "Dalam Perjalanan",
      scheduled: "Dijadualkan",
      delayed: "Lewat",
      completed: "Selesai",
      noTripsAvailable: "Tiada perjalanan tersedia",
      headcount: "Bilangan Penumpang",
      addPassenger: "Tambah Penumpang",
      removePassenger: "Buang Penumpang",
      sosEscalation: "SOS / Eskalasi",
      fleetDashboard: "Papan Pemuka Armada",
      addAdhocBus: "Tambah Bas Ad-Hoc",
      bulkShiftSchedule: "Tukar Jadual Pukal",
      signageMode: "Mod Papan Tanda",
      departing: "Berlepas",
      arriving: "Tiba",
      status: "Status",
      capacity: "Kapasiti",
      from: "Dari",
      to: "Ke",
      transportSchedule: "Jadual Pengangkutan",
      conferenceSchedule: "Jadual Persidangan",
      filterByHotel: "Tapis mengikut hotel / lokasi",
      allLocations: "Semua lokasi",
      quickGuide: "Panduan Ringkas",
      loQuickGuide: "Panduan LO",
      programmePending:
        "Butiran program penuh akan diedarkan semasa pendaftaran.",
      guideAutoRefresh:
        "Halaman ini dikemas kini secara automatik setiap 4 saat.",
      guideHotelFilter:
        "Gunakan penapis hotel untuk melihat bas di lokasi anda sahaja.",
      guideBusFull:
        "Lencana merah 'Full' bermakna tiada tempat duduk. Semak waktu berlepas berikutnya.",
      guideWhatsApp:
        "Ketik sepanduk WhatsApp untuk menyertai kumpulan kemas kini pengangkutan langsung.",
      guideLanguage: "Gunakan ikon glob untuk menukar bahasa paparan.",
      guideLoIncrement:
        "Ketik + atau - untuk melaraskan bilangan penumpang satu demi satu.",
      guideLoTypeCount:
        "Ketik nombor besar untuk menaip bilangan yang tepat secara langsung.",
      guideLoSlider: "Seret slider untuk pelarasan cepat.",
      guideLoSos:
        "Tekan SOS hanya dalam kecemasan sebenar. Anda akan diminta memberikan penerangan ringkas.",
      guideLoOffline:
        "Tiada isyarat? Perubahan disimpan secara setempat dan disegerakkan secara automatik apabila disambungkan semula.",
    },
  },
  my: {
    locale: "my",
    label: "မြန်မာဘာသာ",
    strings: {
      nextDepartures: "နောက်ထွက်ခွာချိန်",
      seatsAvailable: "ထိုင်ခုံလွတ်",
      seatsFilled: "ထိုင်ခုံပြည့်",
      whatsappBanner: "WhatsApp မှတိုက်ရိုက်အပ်ဒိတ်များလက်ခံပါ",
      boarding: "တက်နေသည်",
      enRoute: "ခရီးလမ်းတွင်",
      scheduled: "စီစဉ်ထား",
      delayed: "နောက်ကျ",
      completed: "ပြီးဆုံး",
      noTripsAvailable: "ခရီးစဉ်မရှိပါ",
      headcount: "ခရီးသည်အရေအတွက်",
      addPassenger: "ခရီးသည်ထည့်ပါ",
      removePassenger: "ခရီးသည်ဖယ်ပါ",
      sosEscalation: "အရေးပေါ်",
      fleetDashboard: "ယာဉ်ထိန်းချုပ်ခန်း",
      addAdhocBus: "ယာဉ်ထပ်ထည့်",
      bulkShiftSchedule: "အချိန်ဇယားပြောင်း",
      signageMode: "ဆိုင်းဘုတ်မုဒ်",
      departing: "ထွက်",
      arriving: "ရောက်",
      status: "အခြေအနေ",
      capacity: "ဆံ့နိုင်မှု",
      from: "မှ",
      to: "သို့",
      transportSchedule: "ပို့ဆောင်ရေးဇယား",
      conferenceSchedule: "ညီလာခံဇယား",
      filterByHotel: "ဟိုတယ် / တည်နေရာဖြင့် စစ်ထုတ်ပါ",
      allLocations: "နေရာအားလုံး",
      quickGuide: "အမြန်လမ်းညွှန်",
      loQuickGuide: "LO လမ်းညွှန်",
      programmePending: "ပရိုဂရမ်အသေးစိတ်ကို မှတ်ပုံတင်ချိန်တွင် ဝေပေးမည်",
      guideAutoRefresh:
        "အီစာမျက်နှာသည် စက်ကန့် 4 တိုင်း အလိုအလျောမှု ပြောင်လဲသည်သည်",
      guideHotelFilter:
        "သင်းအောအမြန်နေရာရှိ ဘတ်စ်ကားမျာသာ မှတ်ဥေယ်မှုမ ဘတ်စ်ကားမျာသာကိုသာကို သုံပါ",
      guideBusFull:
        "အနီရောင် 'Full' ပြောတသားချက် ထိုင်ခုံကုန်ဆားကြောင် နောအချိန်ကို သပြောပါ",
      guideWhatsApp:
        "WhatsApp banner ကိုနှိပ်ကာ တိုက်ရိုက်ပို့ဆောင်အဖွဲကို ဝင်ပါ",
      guideLanguage: "ကမျာဘာသင်ကေတကို အသုံပြုကာ ဖောပြောဘာသာကို ပြောပါ",
      guideLoIncrement:
        "ခရီသည်အရေအတွက်ကို တစ်ဤီချင်း ချန်ညွှန်ရန် + သို့မဟုတ် - ကိုနှိပ်ပါ",
      guideLoTypeCount: "ကြီးသောအရေကို တိုက်ရိုက်ထည့ရန် ကိပြက်သော နှိပ်ပါ",
      guideLoSlider: "လျင်မြန်စေ slider ကိုဆဲပါ",
      guideLoSos:
        "အမြန်သောဆိုင်ရာသာလာဘက်သာ SOS ကိုသာနှိပ်ပါအ အကျည်ချုပြောတွင်ကို မေးမည်ဖြစ်သည်",
      guideLoOffline:
        "အချက်ပြုမရှိ? ပြောမ်လဲးမျာကို ဒေသမ်ကည်သိမ်ႆခိန်ပြီပြန်ချိတ်ဆက် အလိုအလျောမှု ထပ်တူကျသည်",
    },
  },
  tet: {
    locale: "tet",
    label: "Tetum",
    strings: {
      nextDepartures: "Partida Tuir Mai",
      seatsAvailable: "fatin mamuk",
      seatsFilled: "fatin nakonu",
      whatsappBanner: "Simu atualizasaun direta liu WhatsApp",
      boarding: "Tama hela",
      enRoute: "Iha dalan",
      scheduled: "Programa ona",
      delayed: "Atrazadu",
      completed: "Remata",
      noTripsAvailable: "La iha viajen disponivel",
      headcount: "Numeru pasajeiru",
      addPassenger: "Aumenta pasajeiru",
      removePassenger: "Hasai pasajeiru",
      sosEscalation: "SOS / Eskalasaun",
      fleetDashboard: "Painel frota",
      addAdhocBus: "Aumenta Bus Ad-Hoc",
      bulkShiftSchedule: "Muda orariu tomak",
      signageMode: "Modu sinaliza",
      departing: "Partida",
      arriving: "Xega",
      status: "Estadu",
      capacity: "Kapasidade",
      from: "Husi",
      to: "Ba",
      transportSchedule: "Orarium Transporte",
      conferenceSchedule: "Orarium Konferénsia",
      filterByHotel: "Filtra bazeia ba hotel / fatin",
      allLocations: "Fatin hotu",
      quickGuide: "Gía Rápidu",
      loQuickGuide: "Gía LO",
      programmePending: "Detalle kompletu programa sei fahe iha rejistu.",
      guideAutoRefresh:
        "Pajina ida-ne'e atualiza automatikamente kada segundu 4.",
      guideHotelFilter: "Uza filtru hotel hodi haree deit bus iha nia fatin.",
      guideBusFull:
        "Insignia mean 'Full' hateten fatin la iha ona. Haree partida tuir mai.",
      guideWhatsApp:
        "Toka banner WhatsApp hodi tama grupo atualizasaun transporte direktu.",
      guideLanguage: "Uza icone globu hodi troka lian hatudu.",
      guideLoIncrement: "Toka + ka - hodi ajusta numeru pasajeiru ida-idak.",
      guideLoTypeCount:
        "Toka numeru boot hodi hakerek numeru exatu diretamente.",
      guideLoSlider: "Rihik slider ba ajustamentu rapidu.",
      guideLoSos:
        "Toka SOS deit bainhira iha emerjencia real. Ita sei husu hodi deskreve badak.",
      guideLoOffline:
        "La iha sinal? Mudansa sei salva iha lokal no sinkroniza automatikamente bainhira liga fali.",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getLocaleList(): { locale: Locale; label: string }[] {
  return Object.values(dictionaries).map((d) => ({
    locale: d.locale,
    label: d.label,
  }));
}
