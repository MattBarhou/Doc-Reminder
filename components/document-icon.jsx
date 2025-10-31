import { 
  FaPassport, 
  FaHeart, 
  FaIdCard, 
  FaShieldAlt, 
  FaGlobe, 
  FaFile 
} from "react-icons/fa";

export default function DocumentIcon({ type }) {
  const icons = {
    passport: <FaPassport className="w-8 h-8" />,
    healthcard: <FaHeart className="w-8 h-8" />,
    license: <FaIdCard className="w-8 h-8" />,
    insurance: <FaShieldAlt className="w-8 h-8" />,
    visa: <FaGlobe className="w-8 h-8" />,
    other: <FaFile className="w-8 h-8" />,
  };

  return icons[type] || icons.other;
}
