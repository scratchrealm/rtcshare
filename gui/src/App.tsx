import { HashRouter } from 'react-router-dom'
import './App.css'
import MainWindow from './MainWindow'
import SetupRtcshare from './SetupRtcshare'

function App() {
  return (
    <HashRouter>
      <SetupRtcshare>
        <MainWindow />
      </SetupRtcshare>
    </HashRouter>
  )
}

export default App
