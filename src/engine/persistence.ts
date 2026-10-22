import type {Progress,Question,Attempt} from '../types';import {validateProgress} from './validation';
export const STORAGE_KEY='leython-capm-v1';
export function emptyProgress():Progress{return {version:1,visited:[],seen:[],history:[],bookmarks:[],notes:{},reports:[],attempts:[],activeId:null,preferences:{shuffle:true},lastPage:'inicio'}}
export function loadProgress(bank:Question[]):{progress:Progress;error:string|null}{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return {progress:emptyProgress(),error:null};const parsed=JSON.parse(raw);const errors=validateProgress(parsed,bank);if(errors.length)return {progress:emptyProgress(),error:'No se pudo recuperar el progreso: '+errors[0]+'. El respaldo existente no se sobrescribió.'};return {progress:parsed,error:null}}catch{return {progress:emptyProgress(),error:'El almacenamiento local no está disponible o contiene datos dañados.'}}}
export function saveProgress(p:Progress){localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}
export function withAttempt(p:Progress,a:Attempt):Progress{return {...p,activeId:a.finishedAt?null:a.id,attempts:[...p.attempts.filter(x=>x.id!==a.id),a]}}
export function recordResults(p:Progress,a:Attempt):Progress{const existing=p.history.filter(h=>h.attemptId!==a.id);return {...p,history:[...existing,...a.questionIds.flatMap(questionId=>{const ans=a.answers[questionId];return ans?.selectedIds.length?[{questionId,selectedIds:ans.selectedIds,at:ans.at??a.finishedAt??Date.now(),attemptId:a.id,wasNew:a.newIds.includes(questionId)}]:[]})]}}

/** Removes only this session's records; shared notes and other sessions survive. */
export function removeAttempt(p: Progress, id: string): Progress {
  const removed = p.attempts.find(a => a.id === id);
  if (!removed) return p;
  const attempts = p.attempts.filter(a => a.id !== id);
  const history = p.history.filter(h => h.attemptId !== id);
  // newIds is the existing snapshot of questions unseen before this attempt.
  // Do not reset a question that was already seen or is used by another session.
  const retainedSeen = new Set(history.map(h => h.questionId));
  for (const attempt of attempts) for (const questionId of Object.keys(attempt.answers)) retainedSeen.add(questionId);
  const newlySeenHere = new Set(removed.newIds);
  return {
    ...p, attempts, history,
    activeId: p.activeId === id ? null : p.activeId,
    seen: p.seen.filter(questionId => !newlySeenHere.has(questionId) || retainedSeen.has(questionId))
  };
}
