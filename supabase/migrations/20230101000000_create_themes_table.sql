   -- テーマテーブルの作成
   CREATE TABLE themes (
     id BIGSERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     fields TEXT[] NOT NULL,
     prompt_template TEXT NOT NULL
   );

   -- 初期データの挿入
   INSERT INTO themes (name, fields, prompt_template)
   VALUES 
     ('ブログ記事作成', 
      ARRAY['タイトル', 'キーワード', '対象読者'], 
      '以下の情報を元に、魅力的なブログ記事を書いてください：\n\nタイトル：{タイトル}\nキーワード：{キーワード}\n対象読者：{対象読者}\n\n記事の構成：\n1. 導入\n2. 本文（3つのポイント）\n3. まとめ'),
     
     ('商品説明文', 
      ARRAY['商品名', '特徴', 'ターゲット層'], 
      '{ターゲット層}向けの{商品名}の商品説明文を書いてください。以下の特徴を含めてください：\n\n{特徴}\n\n説明文は簡潔で魅力的なものにし、購買意欲を高めるような内容にしてください。'),
     
     ('SNS投稿', 
      ARRAY['プラットフォーム', '目的', 'トーン'], 
      '{プラットフォーム}向けの投稿を作成してください。\n\n目的：{目的}\nトーン：{トーン}\n\n投稿は簡潔で、エンゲージメントを高めるような内容にしてください。ハッシュタグも適切に含めてください。');

   -- インデックスの作成（オプション、パフォーマンス向上のため）
   CREATE INDEX idx_themes_name ON themes (name);