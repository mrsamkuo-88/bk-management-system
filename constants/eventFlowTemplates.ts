export const EVENT_FLOW_TEMPLATES = {
    '抓周派對 (Zhuazhou)': [
        { time: '10:00', activity: '賓客入場', description: '播放迎賓音樂，引導賓客簽到' },
        { time: '10:30', activity: '主持人開場', description: '介紹壽星寶寶與家長' },
        { time: '10:45', activity: '抓周儀式', description: '準備米篩、聰明門，寶寶抓周' },
        { time: '11:15', activity: '全家福合影', description: '攝影師協助拍攝' },
        { time: '11:30', activity: '享用餐點', description: 'Buffet/點心開始供應' },
        { time: '13:00', activity: '活動圓滿結束', description: '發送伴手禮' }
    ],
    '春酒尾牙 (Spring Wine)': [
        { time: '18:00', activity: '迎賓入場', description: '接待處簽到，領取抽獎券' },
        { time: '18:30', activity: '長官致詞', description: '總經理/董事長致詞' },
        { time: '19:00', activity: '開席上菜', description: '主桌敬酒' },
        { time: '19:30', activity: '表演節目', description: '樂團/員工表演' },
        { time: '20:00', activity: '第一階段抽獎', description: '抽出小獎與紅包' },
        { time: '20:30', activity: '敬酒時間', description: '各桌互動' },
        { time: '21:00', activity: '最大獎抽出', description: '加碼時間' },
        { time: '21:30', activity: '活動結束', description: '期待明年再見' }
    ],
    '生日派對 (Birthday Party)': [
        { time: '11:00', activity: '佈置準備', description: '氣球、背板架設' },
        { time: '12:00', activity: '壽星抵達', description: '驚喜歡迎' },
        { time: '12:30', activity: '派對開始', description: '享用美食與飲料' },
        { time: '13:30', activity: '切蛋糕儀式', description: '唱生日快樂歌、許願' },
        { time: '14:00', activity: '遊戲互動', description: '團體小遊戲' },
        { time: '15:00', activity: '派對結束', description: '合影留念' }
    ],
    '說明會 (Briefing)': [
        { time: '13:30', activity: '報到接待', description: '領取講義與識別證' },
        { time: '14:00', activity: '會議開始', description: '主持人開場' },
        { time: '14:10', activity: '產品介紹', description: '主講人簡報' },
        { time: '15:00', activity: '中場休息', description: '茶點時間' },
        { time: '15:20', activity: 'Q&A 交流', description: '開放提問' },
        { time: '16:00', activity: '會議結束', description: '會後個別交流' }
    ],
    '遊艇外燴 (Yacht Catering)': [
        { time: '16:00', activity: '後勤登船', description: '餐點與酒水上船' },
        { time: '16:30', activity: '賓客登船', description: '迎賓香檳' },
        { time: '17:00', activity: '啟航', description: '船長廣播' },
        { time: '17:30', activity: '甲板派對', description: 'Finger Food 與調酒' },
        { time: '19:00', activity: '返航', description: '準備靠岸' },
        { time: '19:30', activity: '下船', description: '確認無物品遺留' }
    ],
    '西式餐盒 (Box Meal)': [
        { time: '10:00', activity: '餐盒製作', description: '廚房分裝' },
        { time: '11:00', activity: '裝箱盤點', description: '確認數量與特殊餐點' },
        { time: '11:30', activity: '送達現場', description: '簽收確認' },
        { time: '12:00', activity: '發放餐盒', description: '依照部門/組別發放' },
        { time: '13:00', activity: '回收餐盒', description: '垃圾分類處理' }
    ],
    '內用Buffet (Dine-in Buffet)': [
        { time: '11:30', activity: '開放入席', description: '帶位入座' },
        { time: '12:00', activity: '取餐說明', description: '介紹餐點特色' },
        { time: '12:10', activity: '用餐時間', description: 'Buffet 自由取用' },
        { time: '13:00', activity: '甜點時間', description: '更換甜點盤' },
        { time: '14:00', activity: '餐期結束', description: '結帳與送客' }
    ],
    '內用點心 (Dine-in Snacks)': [
        { time: '14:00', activity: '午茶入席', description: '安排座位' },
        { time: '14:15', activity: '點心塔上桌', description: '包含鹹點與甜點' },
        { time: '14:30', activity: '茶飲服務', description: '詢問茶或咖啡' },
        { time: '16:00', activity: '用餐結束', description: '打包服務' }
    ]
};
