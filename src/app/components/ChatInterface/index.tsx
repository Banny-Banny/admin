import { useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import styles from "./styles.module.css";

interface Message {
  id: number;
  sender: 'admin' | 'customer';
  text: string;
  time: string;
}

interface Inquiry {
  id: string;
  roomId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

interface ChatInterfaceProps {
  inquiry: Inquiry;
  onClose: () => void;
}

export function ChatInterface({ inquiry, onClose }: ChatInterfaceProps) {
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'customer',
      text: inquiry.message,
      time: formatDate(inquiry.createdAt),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const now = new Date();
      const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: 'admin',
          text: newMessage,
          time: timeString,
        },
      ]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.c_1er3iqn}>
      {/* Header */}
      <div className={styles.c_1hlwyim}>
        <div className={styles.c_2ca09x}>
          <div className={styles.c_1oa1gq1}>
            {inquiry.customer.name.charAt(0)}
          </div>
          <div>
            <h3 className={styles.c_we5pmo}>{inquiry.customer.name}</h3>
            <p className={styles.c_ibg1vp}>{inquiry.customer.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={styles.c_1us4dfh}
        >
          <X size={20} />
        </button>
      </div>

      {/* Subject */}
      <div className={styles.c_1e5xuuz}>
        <p className={styles.c_ibg2me}>문의 제목</p>
        <p className={styles.c_1rg4z9e}>{inquiry.subject}</p>
      </div>

      {/* Messages */}
      <div className={styles.c_1g2rryz}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageRow} ${
              message.sender === 'admin' ? styles.messageRowAdmin : styles.messageRowUser
            }`}
          >
            <div
              className={`${styles.messageBubble} ${
                message.sender === 'admin'
                  ? styles.messageBubbleAdmin
                  : styles.messageBubbleUser
              }`}
            >
              <p className={styles.c_ketwm6}>{message.text}</p>
              <p
                className={`${styles.messageTime} ${
                  message.sender === 'admin'
                    ? styles.messageTimeAdmin
                    : styles.messageTimeUser
                }`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className={styles.c_cnx530}>
        <div className={styles.c_3pq6bm}>
          <button className={styles.c_1us4dfh}>
            <Paperclip size={20} className={styles.c_1cnlnvv} />
          </button>
          <div className={styles.c_1dzu82l}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className={styles.c_199bjjd}
              rows={2}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={styles.c_ybeyki}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
