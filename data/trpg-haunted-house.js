window.TRPG_SCENARIOS = window.TRPG_SCENARIOS || {};

window.TRPG_SCENARIOS['haunted-house'] = {
  id: 'haunted-house',
  campaignId: 'haunted-house-1',
  title: '무언가 나오는 폐가',
  bookTitle: '보겜동 여행일지 - 무언가 나오는 폐가',
  startScene: 'internet',
  maxHp: 10,
  maxStamina: 10,
  assignedNumbers: {
    hyunsu: 1,
    sieun: 2,
    sugang: 3,
    somi: 4,
    host: 5
  },
  scenes: {
    internet: {
      title: '공포게시판',
      text: '최근 인터넷 공포게시판에서 근처 산의 폐가가 새로운 심령 스팟으로 떠오르고 있다. 폐가에 들어갔던 사람 하나는 돌아온 뒤 이상해졌고, 얼마 지나지 않아 연락까지 끊겼다는 글이 올라와 있다.',
      actions: [
        {
          id: 'research',
          label: '폐가에 대해 더 조사한다',
          cost: 1,
          type: 'roll',
          difficulty: 2,
          onceFlag: 'internetResearch',
          successText: '게시판의 후속 글과 오래된 기사를 찾아냈다.',
          failureText: '관련 글이 너무 뒤섞여 있다. 쓸 만한 자료는 아직 찾지 못했다.',
          success: {
            flag: 'internetResearch',
            clues: [
              '폐가 안쪽에서 동물의 눈처럼 빛나는 여러 시선을 봤다는 탐험 후기가 있다.',
              '폐가 근처에서는 2년 전 지하철역 공사가 연이은 인명사고 때문에 중단되었다.'
            ]
          }
        },
        {
          id: 'goMountain',
          label: '폐가가 있는 산으로 향한다',
          cost: 1,
          type: 'move',
          next: 'mountain',
          logText: '일행은 저녁 7시, 폐가가 있다는 산으로 향했다.'
        }
      ]
    },

    mountain: {
      title: '산 입구',
      text: '산은 아파트 단지를 둘러싸듯 이어져 있다. 길에서 만난 주민들은 늦은 시간인데도 이상할 정도로 밝고 친절하다. 산 중턱에는 금방이라도 무너질 듯한 낡은 폐가가 달빛 아래 서 있다.',
      actions: [
        {
          id: 'watchResidents',
          label: '주변 주민들의 모습을 살펴본다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'residentsOdd',
          successText: '친절한 표정이 지나치게 한결같다는 묘한 위화감을 느꼈다.',
          failureText: '주민들은 그저 친절해 보인다.',
          success: {
            flag: 'residentsOdd',
            clues: ['아파트 주민들의 밝고 친절한 태도에는 설명하기 어려운 위화감이 있다.']
          }
        }
      ],
      vote: {
        id: 'enterHouse',
        prompt: '폐가 앞에 도착했다. 어떻게 할까?',
        choices: [
          { id: 'enter', label: '폐가 안으로 들어간다', resolve: 'enterHouse' },
          { id: 'leave', label: '위험해 보인다. 돌아간다', resolve: 'earlyLeave' }
        ]
      }
    },

    ground: {
      title: '폐가 1층',
      text: '허름한 외관과 달리 안쪽은 놀랄 만큼 정돈되어 있다. 입구 양쪽으로 휴게실이 있고, 한쪽에는 사무실이 보인다. 폐가에 들어오지 말라고 경고하는 정민서와, 반대로 친근하게 말을 걸며 안쪽을 구경하라고 권하는 김재윤도 나타난다.',
      actions: [
        {
          id: 'lounge',
          label: '입구 쪽 휴게실을 조사한다',
          cost: 1,
          type: 'roll',
          difficulty: 2,
          onceFlag: 'flashlightFound',
          successText: '침대 아래에서 배터리가 넉넉히 남은 손전등을 찾았다.',
          failureText: '낡은 침대와 먼지뿐이다. 조금 더 살펴볼 수 있을 것 같다.',
          success: {
            flag: 'flashlightFound',
            item: '손전등'
          }
        },
        {
          id: 'office',
          label: '사무실을 조사한다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'officeRecord',
          successText: '서류가 빠진 파일 표지 하나를 발견했다.',
          failureText: '책상과 의자만 남아 있다. 중요한 서류는 보이지 않는다.',
          success: {
            flag: 'officeRecord',
            clues: ['이 건물은 과거 아파트 지하철역 공사현장 인부들이 사용하던 건물이었다.']
          }
        },
        {
          id: 'jaeyoon',
          label: '김재윤과 이야기를 나눈다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'jaeyoonOdd',
          successText: '유쾌한 말투와 달리 그의 표정에는 지나치게 밝은 부자연스러움이 있다. 무언가 숨기고 있다.',
          failureText: '김재윤은 그저 폐가 구경을 좋아하는 사람처럼 보인다.',
          success: {
            flag: 'jaeyoonOdd',
            clues: ['김재윤은 무언가를 숨기고 있으며 일행을 폐가 안쪽으로 유도하려 한다.']
          }
        },
        {
          id: 'hiddenDoor',
          label: '사무실 깊숙한 곳을 살펴본다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'basementFound',
          successText: '벽처럼 보이던 부분이 안쪽으로 밀린다. 바로 아래로 가파른 계단이 이어져 있다.',
          failureText: '낡은 벽과 서류함뿐이다. 다른 곳도 더 살펴볼 수 있다.',
          success: {
            flag: 'basementFound',
            clues: ['사무실 끝에 숨겨진 지하실 입구가 있다.']
          }
        }
      ],
      vote: {
        id: 'basementDecision',
        prompt: '폐가를 더 조사할까, 이제 돌아갈까?',
        choices: [
          { id: 'down', label: '숨겨진 지하실로 내려간다', resolve: 'goBasement', requireFlag: 'basementFound' },
          { id: 'leave', label: '조사를 끝내고 밖으로 나간다', resolve: 'jaeyoonPush' }
        ]
      }
    },

    basement: {
      title: '숨겨진 지하실',
      text: '부서진 나무계단 아래는 손전등 없이는 한 치 앞도 볼 수 없을 만큼 어둡다. 차가운 콘크리트 벽과 축축한 공기 사이로, 왼쪽 통로에는 심하게 훼손된 시체들이 놓여 있다. 어느 순간 김재윤의 모습도 사라졌다.',
      actions: [
        {
          id: 'foodStorage',
          label: '식량창고를 살펴본다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'foodStorage',
          successText: '흙으로 만든 항아리 안에서 토막 난 시체를 발견한다. 이곳은 누군가의 식량창고다.',
          failureText: '기분 나쁜 냄새 때문에 오래 살펴보기 어렵다. 그러나 아래로 이어지는 계단은 찾았다.',
          success: {
            flag: 'foodStorage',
            clues: ['지하의 항아리에는 훼손된 시체가 보관되어 있다. 이 폐가는 사람을 위한 장소가 아니다.']
          }
        },
        {
          id: 'goTunnel',
          label: '더 아래의 콘크리트 계단으로 내려간다',
          cost: 1,
          type: 'move',
          next: 'tunnel',
          logText: '일행은 식량창고 뒤편의 계단을 따라 더 깊은 지하통로로 내려갔다.'
        }
      ]
    },

    tunnel: {
      title: '중단된 지하철 통로',
      text: '긴 계단 끝에는 공사가 중단된 거대한 지하철 통로가 펼쳐진다. 바닥에는 많은 피가 묻어 있고, 멀리서 속닥거리는 소리와 낄낄거리는 웃음이 들린다. 들어왔던 길로 돌아가는 것은 위험해 보인다.',
      actions: [
        {
          id: 'wind',
          label: '바람이 들어오는 방향을 찾는다',
          cost: 1,
          type: 'roll',
          difficulty: 2,
          onceFlag: 'escapeRoute',
          successText: '희미한 바람이 불어오는 방향을 찾아냈다. 밖으로 이어지는 길일 가능성이 높다.',
          failureText: '통로가 너무 넓고 차갑다. 바람의 방향이 잘 느껴지지 않는다.',
          success: {
            flag: 'escapeRoute',
            clues: ['지하통로 한쪽에서 바깥으로 이어지는 듯한 바람이 들어온다.']
          }
        },
        {
          id: 'listen',
          label: '낄낄거리는 소리에 귀를 기울인다',
          cost: 1,
          type: 'roll',
          difficulty: 3,
          onceFlag: 'heardNames',
          successText: '속삭임 사이에서 일행의 이름과 사는 곳이 들린다. 그 순간 어둠 속에서 세 개의 형체가 모습을 드러낸다.',
          failureText: '소리의 정체를 알아듣기 전에 어둠 속에서 세 개의 형체가 모습을 드러낸다.',
          success: {
            flag: 'heardNames',
            clues: ['지하의 존재들은 이미 일행의 이름과 사는 곳을 알고 있다.']
          },
          nextRegardless: 'escape'
        },
        {
          id: 'moveAhead',
          label: '소리를 무시하고 통로를 따라 달린다',
          cost: 1,
          type: 'move',
          next: 'escape',
          logText: '어둠 속에서 무언가가 따라붙기 시작했다.'
        }
      ]
    },

    escape: {
      title: '추격',
      text: '세 마리의 괴물이 어둠 속에서 모습을 드러낸다. 사람처럼 보이면서도 사람이라고 할 수 없는 얼굴과 긴 발톱이 손전등 빛에 스친다. 싸워 쓰러뜨리는 것보다 밖으로 빠져나가는 것이 먼저다.',
      escapeTarget: 3,
      actions: [
        {
          id: 'run',
          label: '있는 힘껏 달린다',
          cost: 2,
          type: 'escapeRoll',
          difficulty: 3,
          successText: '괴물과 거리를 벌렸다.',
          failureText: '뒤에서 휘둘러진 발톱에 스쳤다.',
          failureDamage: 1
        },
        {
          id: 'fight',
          label: '괴물을 밀쳐내고 길을 만든다',
          cost: 3,
          type: 'escapeRoll',
          difficulty: 4,
          successText: '괴물을 잠시 밀어내고 도망칠 틈을 만들었다.',
          failureText: '정면으로 맞선 대가로 크게 다쳤다.',
          failureDamage: 2
        }
      ]
    },

    finale: {
      title: '산 밖으로',
      text: '긴 통로 끝에서 폐가 옆 공사현장으로 이어지는 사다리를 찾아냈다. 일행은 가까스로 산을 빠져나와 집으로 돌아간다. 하지만 정말 끝난 걸까.',
      actions: [
        {
          id: 'finalLuck',
          label: '마지막 판정을 한다',
          cost: 1,
          type: 'endingRoll',
          difficulty: 3,
          onceFlag: 'finalResolved',
          successEnding: {
            id: 'escaped',
            title: '무사 귀환',
            text: '다섯 사람은 무사히 일상으로 돌아왔다. 그러나 뒤늦게 폐가와 지하철 공사에 얽힌 흔적을 맞춰 보면서, 자신들이 살던 아파트 주변에 인간이 아닌 존재들이 오래전부터 섞여 살아왔다는 끔찍한 사실을 깨닫는다.'
          },
          failureEnding: {
            id: 'only-you',
            title: '이제 너만 남은 거야',
            text: '집에 돌아온 일행을 가족과 지인들은 지나치게 반갑게 맞는다. 그리고 이미 와 있던 손님들이 기분 나쁜 미소를 지으며 다가온다. 폐가에서의 탈출은 끝이 아니었다.'
          }
        }
      ]
    }
  },

  endings: {
    earlyLeave: {
      id: 'early-leave',
      title: '담력시험 취소',
      text: '일행은 폐가에 들어가지 않고 돌아섰다. 별일 없이 집으로 돌아왔지만, 공포게시판의 실종자는 끝내 돌아오지 않았다.'
    },
    darkness: {
      id: 'darkness',
      title: '빛이 없는 곳',
      text: '손전등도 없이 지하로 내려간 순간, 사방에서 짐승 같은 숨소리가 가까워졌다. 아무것도 보이지 않는 어둠 속에서 일행의 여행은 끝났다.'
    },
    pit: {
      id: 'pit',
      title: '더 깊은 곳',
      text: '도망치지 않고 더 깊은 곳으로 향한 끝에 일행은 지하의 무언가에게 붙잡혔다. 그 뒤로 공포게시판에는 또 다른 폐가 탐험 글이 올라오기 시작했다.'
    }
  }
};
