import { Link } from 'react-router';
import { PageHeading } from '../components/common.jsx';

export default function NotFoundPage() {
  return <div className="container page"><PageHeading section="404" title="페이지를 찾을 수 없습니다." description="주소를 확인하거나 메뉴에서 원하는 페이지로 이동해 주세요." /><Link className="text-link" to="/">Home으로 이동 →</Link></div>;
}
