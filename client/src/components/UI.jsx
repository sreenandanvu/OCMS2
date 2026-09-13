import React from 'react';
export function PageHeader({title,sub,action}){return <div className="page-header"><div><h2>{title}</h2><p>{sub}</p></div>{action}</div>}
export function Card({children,className=''}){return <div className={`card ${className}`}>{children}</div>}
export function Table({headers,rows}){return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
export function Empty({text='No records found'}){return <div className="empty">{text}</div>}
