'use client';
import { useState } from 'react';
import { ArrowUpRight, List, X } from '@phosphor-icons/react';
export function Header({ company }: { company: string }) {
  const [open, setOpen] = useState(false);
  return <header className="header"><a className="wordmark" href="#home" aria-label={`${company} 홈`}>m<span className="brand-dot">.</span><span>{company}</span></a><button className="menu-toggle" aria-expanded={open} aria-controls="main-nav" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}>{open ? <X size={24}/> : <List size={24}/>}</button><nav id="main-nav" className={open ? 'nav open' : 'nav'} aria-label="주 메뉴"><a href="#about" onClick={() => setOpen(false)}>회사 소개</a><a href="#services" onClick={() => setOpen(false)}>서비스</a><a href="#process" onClick={() => setOpen(false)}>함께하는 과정</a><a className="nav-contact" href="#contact" onClick={() => setOpen(false)}>프로젝트 문의 <ArrowUpRight size={18}/></a></nav></header>;
}
