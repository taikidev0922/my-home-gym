alter table public.amazon_associate_links
  add column if not exists target_contexts text[] not null default '{}',
  add column if not exists avoid_contexts text[] not null default '{}',
  add column if not exists recommended_anchor_keywords text[] not null default '{}',
  add column if not exists placement_note text not null default '',
  add column if not exists product_role text not null default '',
  add column if not exists suitable_for text[] not null default '{}',
  add column if not exists not_suitable_for text[] not null default '{}',
  add column if not exists priority integer not null default 100;

create index if not exists amazon_associate_links_active_priority_idx
  on public.amazon_associate_links (is_active, priority, category, rank);

update public.amazon_associate_links
set
  product_role = values.product_role,
  target_contexts = values.target_contexts,
  avoid_contexts = values.avoid_contexts,
  recommended_anchor_keywords = values.recommended_anchor_keywords,
  placement_note = values.placement_note,
  suitable_for = values.suitable_for,
  not_suitable_for = values.not_suitable_for,
  priority = values.priority,
  updated_at = now()
from (
  values
    (
      'power-rack-1',
      '初めての本格ラック・コスパ枠',
      array['パワーラック、ハーフラック、ベンチプレス、スクワット、懸垂を始めたい記事', '省スペースで本格ホームジムを組みたい文脈', '低予算でラック中心の環境を作る比較記事'],
      array['ラットプルやケーブル種目を主題にした記事', '高重量を長期的に伸ばす上級者向けだけの記事'],
      array['パワーラック', 'ハーフラック', 'ベンチプレス', 'スクワット', '懸垂', '省スペース', '低予算'],
      'ラックを導入する判断軸や、最初の一台を選ぶ段落の直後に置く。天井高、バーベル、ベンチが別途必要な注意点に触れてから入れる。',
      array['最初のラックを安く置きたい人', '省スペースでBIG3と懸垂を始めたい人'],
      array['ラットプル付きラックが必須の人', '高重量を最優先する上級者'],
      10
    ),
    (
      'power-rack-2',
      '幅調整できる低価格ハーフラック',
      array['ラック幅やシャフト互換性に触れる記事', '低価格ラックの比較記事', '賃貸や狭い部屋でラックを検討する記事'],
      array['ブランド安心感や本格性を最優先する記事'],
      array['横幅調整', 'ハーフラック', 'パワーラック', 'BIG3', '懸垂', '低価格'],
      '幅調整や価格を比較している段落の近くに置く。組み立てや安定感はレビュー確認が必要という文脈と合わせる。',
      array['幅調整できるラックを安く探している人', 'シャフト幅との相性を気にする人'],
      array['高重量ラックを長く使いたい人'],
      20
    ),
    (
      'power-rack-3',
      'ラットプル付き本格寄りラック',
      array['ラットプル、ローイング、ディップスまで自宅で行いたい記事', 'ラック中心の本格ホームジム構築記事', '予算と設置スペースを広めに取れる記事'],
      array['低予算、ワンルーム、省スペースだけを主題にした記事'],
      array['ラットプル', 'ローイング', 'ディップス', 'パワーゲージ', '本格ホームジム'],
      '本格ラックのメリットと設置スペースの注意点を説明した直後に置く。搬入、重量、別売りパーツに触れてから入れる。',
      array['ラック中心に長く鍛えたい人', '背中種目まで自宅で完結したい人'],
      array['設置スペースが狭い人', 'できるだけ安く始めたい人'],
      30
    ),
    (
      'adjustable-dumbbell-1',
      '長く使う高重量可変式ダンベル',
      array['可変式ダンベルの重量刻み、40kg、長期利用を扱う記事', 'ダンベル種目を伸ばしたい記事', '見た目や所有感も重視する記事'],
      array['低予算だけを主題にした記事', '初心者が最低限の重量で始める記事'],
      array['可変式ダンベル', '40kg', '1kg刻み', 'ダンベル', 'メタル'],
      '重量調整の細かさや長期的な伸びしろを説明した直後に置く。価格が高めで搬入重量にも注意という説明と合わせる。',
      array['ダンベル種目を長く伸ばしたい人', '細かい重量調整を重視する人'],
      array['初期費用を最小化したい人', '軽量ダンベルだけで十分な人'],
      10
    ),
    (
      'adjustable-dumbbell-2',
      '操作性と見た目重視の20kg可変式ダンベル',
      array['20kgまでの可変式ダンベル比較記事', '省スペースで扱いやすいダンベルを探す記事', '見た目と操作性を重視する記事'],
      array['30kg以上の高重量が必要な記事'],
      array['フレックスベル', '20kg', '2kg刻み', '可変式ダンベル', '省スペース'],
      '操作性、見た目、20kgで足りるかを説明する段落の近くに置く。高重量狙いでは物足りない可能性も添える。',
      array['20kgまでで十分な人', '片手で重量変更したい人'],
      array['40kg級まで伸ばしたい人'],
      20
    ),
    (
      'adjustable-dumbbell-3',
      '低予算で始める24kg可変式ダンベル',
      array['安い可変式ダンベル、初心者向け自宅トレ、まず一式揃える記事', '予算を抑えたホームジム構築記事'],
      array['高級感や耐久性を最優先する記事', '40kg級の重量を扱う記事'],
      array['24kg', '可変式ダンベル', '低予算', '初心者', 'コスパ'],
      '予算を抑えて最初のダンベルを選ぶ段落に置く。操作感や耐久性は上位機と比較したいという注意点も添える。',
      array['安く可変式ダンベルを始めたい人', '初心者から中級者'],
      array['高重量を扱う上級者', '質感を最優先する人'],
      30
    ),
    (
      'bench-1',
      '低価格の最初の可変ベンチ',
      array['ベンチを最初に買う記事', 'ダンベル種目の幅を広げる記事', '低予算ベンチ比較記事'],
      array['高重量ベンチプレスの安定性だけを重視する記事'],
      array['トレーニングベンチ', '可変式ベンチ', 'インクライン', 'デクライン', '低価格'],
      'ダンベル種目を増やすためにベンチが必要、という段落の直後に置く。安さと折りたたみ性に触れ、高重量時の安定感確認も添える。',
      array['最初のベンチを安く買いたい人', 'ダンベル種目を増やしたい人'],
      array['高重量ベンチプレスを主目的にする人'],
      10
    ),
    (
      'bench-2',
      '収納しやすい格安折りたたみベンチ',
      array['折りたたみ収納、低価格、レビュー評価に触れるベンチ記事', 'ワンルームや省スペースの記事'],
      array['耐荷重や安定感を最優先する本格記事'],
      array['折りたたみベンチ', 'トレーニングベンチ', '収納', '低価格', '省スペース'],
      '収納性や価格を説明した段落の近くに置く。耐荷重や幅など体格との相性確認を添える。',
      array['収納性を重視する人', 'まず安くベンチを置きたい人'],
      array['高重量を扱う人'],
      20
    ),
    (
      'bench-3',
      '安定感寄りの中位ベンチ',
      array['格安ベンチより安定感を重視する記事', 'インクライン、フラット、デクラインを比較する記事'],
      array['最安だけを主題にした記事'],
      array['BARWING', '耐荷重300kg', 'インクライン', 'デクライン', '安定感'],
      '安さだけでなく安定感も必要、という比較段落の直後に置く。重量が少し重い点や収納性とのバランスに触れる。',
      array['中位ベンチを検討する人', '安定感も欲しい人'],
      array['とにかく最安で探している人'],
      30
    ),
    (
      'floor-mat-1',
      '広めに敷ける床保護ジョイントマット',
      array['床保護、防音、防振、ジョイントマット、賃貸ホームジムの記事', 'ラックやダンベル前の床準備記事'],
      array['高重量ラック直下の防振だけを主題にした記事'],
      array['床保護', '防音', '防振', 'ジョイントマット', '賃貸', 'EVA'],
      '床対策の必要性を説明した直後に置く。高重量ラックでは合板やゴムマット併用も検討する注意点と合わせる。',
      array['床の傷と生活音を抑えたい人', '広めにマットを敷きたい人'],
      array['本格的な防振だけを求める人'],
      10
    ),
    (
      'floor-mat-2',
      'ラック下の荷重分散に使う構造用合板',
      array['床補強、合板、3層構造、ラック下の荷重分散を扱う記事', '高重量器具の床対策記事'],
      array['柔らかいマットだけを探す記事', '見た目重視の床材記事'],
      array['合板', '構造用合板', '床補強', '荷重分散', '3層構造', 'ラック下'],
      'マットだけでは不安な高重量器具の床対策を説明した直後に置く。仕上げ材ではなく下地材として使う文脈に限定する。',
      array['ラック下の荷重分散を考える人', '床を3層構造にしたい人'],
      array['柔らかいクッション材だけ欲しい人'],
      20
    ),
    (
      'floor-mat-3',
      '安く床全体を覆うEVAジョイントマット',
      array['最低限の床保護、安いジョイントマット、3層構造の下層を扱う記事', '省予算の床対策記事'],
      array['本格防振や高重量ラック直下だけを主題にした記事'],
      array['EVAマット', 'ジョイントマット', '床保護', '安い', '下層'],
      '安く床全体をカバーする選択肢として置く。防振目的では上層にゴムマットなどを重ねる注意点も添える。',
      array['まず安く床を保護したい人', '細かく敷き詰めたい人'],
      array['防振性能を最優先する人'],
      30
    )
) as values(
  slot_key,
  product_role,
  target_contexts,
  avoid_contexts,
  recommended_anchor_keywords,
  placement_note,
  suitable_for,
  not_suitable_for,
  priority
)
where public.amazon_associate_links.slot_key = values.slot_key;

with marker_map(legacy_marker, slot_marker) as (
  values
    ('{{affiliate:wasai-mk780-half-rack}}', '{{affiliate:power-rack-1}}'),
    ('{{affiliate:barwing-hhr01-half-rack}}', '{{affiliate:power-rack-2}}'),
    ('{{affiliate:irotec-multi-power-rack}}', '{{affiliate:power-rack-3}}'),
    ('{{affiliate:lysin-helixmirror-40kg}}', '{{affiliate:adjustable-dumbbell-1}}'),
    ('{{affiliate:flexbell-20kg-2kg-pair}}', '{{affiliate:adjustable-dumbbell-2}}'),
    ('{{affiliate:barwing-adjustable-dumbbell-24kg-pair}}', '{{affiliate:adjustable-dumbbell-3}}'),
    ('{{affiliate:barwing-bw-ajb06-bench}}', '{{affiliate:bench-1}}'),
    ('{{affiliate:gogojump-folding-training-bench}}', '{{affiliate:bench-2}}'),
    ('{{affiliate:barwing-dc04-training-bench}}', '{{affiliate:bench-3}}'),
    ('{{affiliate:airhop-joint-mat}}', '{{affiliate:floor-mat-1}}'),
    ('{{affiliate:kawashima-structural-plywood-12mm}}', '{{affiliate:floor-mat-2}}'),
    ('{{affiliate:showa-eva-joint-mat-12mm}}', '{{affiliate:floor-mat-3}}')
)
update public.blog_articles as article
set
  blocks = (
    select jsonb_agg(
      case
        when jsonb_typeof(block.value -> 'paragraphs') = 'array' then
          jsonb_set(
            block.value,
            '{paragraphs}',
            (
              select jsonb_agg(to_jsonb(coalesce(marker_map.slot_marker, paragraph.value)) order by paragraph.ordinality)
              from jsonb_array_elements_text(block.value -> 'paragraphs') with ordinality as paragraph(value, ordinality)
              left join marker_map on marker_map.legacy_marker = paragraph.value
            )
          )
        else block.value
      end
      order by block.ordinality
    )
    from jsonb_array_elements(article.blocks) with ordinality as block(value, ordinality)
  ),
  metadata = jsonb_set(
    article.metadata,
    '{affiliateMarkerMigratedAt}',
    to_jsonb(now()),
    true
  ),
  updated_at = now()
where exists (
  select 1
  from marker_map
  where article.blocks::text like '%' || marker_map.legacy_marker || '%'
);
