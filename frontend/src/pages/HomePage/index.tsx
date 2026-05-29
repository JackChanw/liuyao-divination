import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDivinationStore } from '@/stores/divinationStore';
import InkButton from '@/components/common/InkButton';
import InkInput from '@/components/common/InkInput';
import './HomePage.css';

export default function HomePage() {
  const setQuestion = useDivinationStore((s) => s.setQuestion);
  const reset = useDivinationStore((s) => s.reset);
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const onStart = () => {
    const q = text.trim();
    if (q.length < 2) return;
    reset();
    setQuestion(q);
    navigate('/divine');
  };

  return (
    <div className="home-page animate-page-in">
      <div className="seal-corner">玄机问卜</div>
      <header className="home-header">
        <h1 className="home-title">六　爻　占　卜</h1>
        <p className="home-subtitle">
          蓍草三变以成爻，六爻齐备而卦显
          <br />
          心诚则灵，问其所惑，玄机自现
        </p>
      </header>

      <section className="home-form">
        <InkInput
          label="所　问　何　事"
          placeholder="请凝神静气，将心中所惑娓娓道来…（如：欲谋此事可成否？）"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
        />
        <div className="char-count">{text.length} / 200</div>

        <div className="home-actions">
          <InkButton onClick={onStart} disabled={text.trim().length < 2}>
            起　卦
          </InkButton>
        </div>
      </section>

      <footer className="home-footer">
        <span>※ 占卜之事，唯诚乃灵 ※</span>
      </footer>
    </div>
  );
}
