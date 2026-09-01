-- 테스트 후 "무언가 나오는 폐가"를 처음 상태로 되돌릴 때만 실행하세요.
-- 기존 TRPG 플레이 기록/투표/메모/플레이어 상태가 모두 삭제됩니다.

delete from public.trpg_votes where campaign_id='haunted-house-1';
delete from public.trpg_logs where campaign_id='haunted-house-1';
delete from public.trpg_players where campaign_id='haunted-house-1';
delete from public.trpg_memo where campaign_id='haunted-house-1';
delete from public.trpg_campaigns where id='haunted-house-1';

insert into public.trpg_campaigns(id,scenario_id,title,status,current_scene,state,version)
values(
  'haunted-house-1','haunted-house','무언가 나오는 폐가','active','internet',
  '{"flags":{},"clues":[],"escapeProgress":0,"ending":null}'::jsonb,1
);
insert into public.trpg_players(campaign_id,user_id,user_name,assigned_number,hp,stamina,stamina_date,items)
values
  ('haunted-house-1','hyunsu','차현수',1,10,10,(now() at time zone 'Asia/Seoul')::date::text,'[]'::jsonb),
  ('haunted-house-1','sieun','연시은',2,10,10,(now() at time zone 'Asia/Seoul')::date::text,'[]'::jsonb),
  ('haunted-house-1','sugang','한수강',3,10,10,(now() at time zone 'Asia/Seoul')::date::text,'[]'::jsonb),
  ('haunted-house-1','somi','김소미',4,10,10,(now() at time zone 'Asia/Seoul')::date::text,'[]'::jsonb),
  ('haunted-house-1','host','김준희',5,10,10,(now() at time zone 'Asia/Seoul')::date::text,'[]'::jsonb);

insert into public.trpg_memo(campaign_id,content,version)
values('haunted-house-1','',1);
