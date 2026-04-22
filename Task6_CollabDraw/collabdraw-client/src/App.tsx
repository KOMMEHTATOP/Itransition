import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing/Landing';
import BoardList from './components/BoardList/BoardList';
import BoardEditor from './components/BoardEditor/BoardEditor';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/boards" element={<BoardList />} />
          <Route path="/boards/:boardId" element={<BoardEditor />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;