import {Component, type ReactNode} from 'react';
import {Download, RotateCcw, TriangleAlert} from 'lucide-react';

export default class AppBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  backup() {
    const raw = localStorage.getItem('leython-capm-v1');
    if (!raw) return;
    const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'capm-progreso-rescate.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="app-recovery"><section className="panel empty"><TriangleAlert size={38}/><h1>No se pudo mostrar esta pantalla</h1><p>El progreso guardado se conserva. Puedes recargar o descargar una copia antes de continuar.</p><div className="button-row"><button className="button primary" onClick={() => location.reload()}><RotateCcw size={18}/> Recargar aplicación</button><button className="button secondary" onClick={() => this.backup()}><Download size={18}/> Rescatar progreso</button></div></section></main>;
  }
}
