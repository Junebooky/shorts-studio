import React from 'react';
export function Button({variant='primary',className='',children,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'ghost'}){
 const items=React.Children.toArray(children);const hasText=items.some(x=>typeof x==='string'&&x.trim()||typeof x==='number');
 // Text actions do not need a second decorative label. Icon-only buttons and explicit SVG navigation remain.
 const content=hasText?items.filter(x=>!React.isValidElement(x)||!('size' in (x.props as object))):children;
 return <button {...props} className={'ds-button ds-button-'+variant+' inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold tracking-tight transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none '+className}>{content}</button>;
}
export function Card({children,className=''}:{children:React.ReactNode;className?:string}){return <section className={'ds-card bg-white rounded-2xl p-5 '+className}>{children}</section>}
export const inputClass='w-full rounded-xl bg-slate-100/75 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-cobalt/30 transition-colors';
export function Segmented({value,onChange}:{value:'produce'|'edit';onChange:(v:'produce'|'edit')=>void}){return <div className="relative isolate flex rounded-full bg-slate-100/90 p-1 shadow-inner min-w-52"><div className={'absolute -z-10 top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-cobalt shadow-[0_4px_14px_rgba(30,96,243,0.35)] transition-transform duration-300 '+(value==='edit'?'translate-x-full':'')}/>{(['produce','edit'] as const).map(v=><button key={v} onClick={()=>onChange(v)} aria-pressed={value===v} className={'flex-1 rounded-full px-3 py-2 text-sm font-bold transition-colors '+(value===v?'text-white':'text-slate-500')}>{v==='produce'?'AI로 만들기':'직접 편집'}</button>)}</div>}
