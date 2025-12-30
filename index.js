apiRouter.post("/timeTable", async (req, res) => {
  if (!parserReady) {
    return res.json({
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "⏳ 서버 준비 중입니다." } }]
      }
    });
  }

  try {
    const params = req.body.action?.params || {};

    const grade = parseInt(params.grade);
    const classroom = parseInt(params.classroom);
    const dayParam = params.day; // 반드시 "내일"

    // 🔒 파라미터 검증
    if (!grade || !classroom) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "학년과 반을 입력해주세요." } }]
        }
      });
    }

    // 🔴 오늘 불가, 내일만 허용
    if (dayParam !== "내일") {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "시간표는 내일만 조회할 수 있습니다." } }]
        }
      });
    }

    const dayOffset = 1; // 항상 내일
    const date = getKoreaDate(dayOffset);
    const dayName = DAYS[date.getDay()];
    const idx = DAY_INDEX[dayName];

    if (idx === undefined) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: `${dayName}에는 수업이 없습니다.` } }]
        }
      });
    }

    const full = await timetableParser.getTimetable();
    const schedule = full[grade]?.[classroom]?.[idx] || [];

    let text = `${dayName} — ${grade}학년 ${classroom}반 시간표\n\n`;

    if (schedule.length === 0) {
      text += "수업이 없습니다!";
    } else {
      text += schedule
        .map(o => `${o.classTime}교시: ${o.subject}`)
        .join("\n");
    }

    return res.json({
      version: "2.0",
      template: { outputs: [{ simpleText: { text } }] }
    });

  } catch (err) {
    console.error(err);
    return res.json({
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "시간표 처리 중 오류 발생" } }]
      }
    });
  }
});
