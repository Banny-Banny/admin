'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getInquirySocketClient,
  type ReceiveMessagePayload,
  type ReadAlertPayload,
} from '../../commons/apis/inquiry/socket';
import {
  getInquiryDetail,
  updateMessage,
  deleteMessage,
  updateInquiryStatus,
} from '../../commons/apis/inquiry';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../commons/components/select';
import { type Inquiry, type InquiryStatus } from '../../commons/types/inquiry';
import styles from './styles.module.css';

interface ChatMessage {
  id: string;
  senderType: 'USER' | 'ADMIN';
  content: string;
  createdAt: string;
  isEditing?: boolean;
}

interface ChatInterfaceProps {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusChange?: (inquiryId: string, newStatus: InquiryStatus) => void;
}

export function ChatInterface({ inquiry, onClose, onStatusChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentStatus, setCurrentStatus] = useState<InquiryStatus>(inquiry.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketClientRef = useRef(getInquirySocketClient());

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

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket.IO 연결 및 초기화
  useEffect(() => {
    const socketClient = socketClientRef.current;
    let isMounted = true;

    const initializeChat = async () => {
      try {
        setIsLoading(true);

        // 1. Socket.IO 연결
        socketClient.connect();

        // 2. 이전 채팅 히스토리 가져오기
        const detailResponse = await getInquiryDetail(inquiry.id);
        
        if (isMounted) {
          // 메시지를 시간순으로 정렬
          const sortedMessages = [...detailResponse.messages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          setMessages(
            sortedMessages.map((msg) => ({
              id: msg.id,
              senderType: msg.senderType,
              content: msg.content,
              createdAt: msg.createdAt,
            }))
          );

          // 3. 방 입장 (inquiry.id를 roomId로 사용)
          await socketClient.joinRoom(inquiry.id);

          // 4. 읽음 알림 전송
          socketClient.sendReadAlert(inquiry.id);

          setIsLoading(false);
          // 초기 메시지 로드 후 스크롤
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('채팅 초기화 실패:', error);
        if (isMounted) {
          setIsLoading(false);
          toast.error('채팅 정보를 불러오는데 실패했습니다.');
        }
      }
    };

    initializeChat();

    // 메시지 수신 핸들러
    const handleReceiveMessage = (payload: ReceiveMessagePayload) => {
      if (isMounted && payload.roomId === inquiry.id) {
        setMessages((prev) => {
          // 중복 메시지 방지
          if (prev.some((msg) => msg.id === payload.id)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: payload.id,
              senderType: payload.senderType,
              content: payload.content,
              createdAt: payload.createdAt,
            },
          ];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    // 읽음 알림 핸들러
    const handleReadAlert = (payload: ReadAlertPayload) => {
      if (isMounted && payload.roomId === inquiry.id) {
        // 읽음 알림 처리 (필요시 UI 업데이트)
      }
    };

    // Socket 이벤트 리스너 등록
    socketClient.onReceiveMessage(handleReceiveMessage);
    socketClient.onReadAlert(handleReadAlert);

    // 연결 에러 핸들러
    const handleError = (error: Error) => {
      console.error('Socket.IO connection error:', error);
      toast.error('연결 오류가 발생했습니다.');
    };

    socketClient.onError(handleError);

    // 정리 함수
    return () => {
      isMounted = false;
      
      // 방 나가기
      socketClient.leaveRoom(inquiry.id);
      
      // 이벤트 리스너 제거
      socketClient.offReceiveMessage(handleReceiveMessage);
      socketClient.offReadAlert(handleReadAlert);
      
      // Socket 연결은 유지 (싱글톤이므로 앱 전체에서 재사용)
      // socketClient.disconnect();
    };
  }, [inquiry.id]);

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();
    
    if (!messageContent) {
      return;
    }

    if (messageContent.length > 1500) {
      toast.error('메시지는 최대 1500자까지 입력할 수 있습니다.');
      return;
    }

    if (isSending) {
      return;
    }

    setIsSending(true);

    try {
      const socketClient = socketClientRef.current;
      
      if (!socketClient.isSocketConnected()) {
        socketClient.connect();
        await socketClient.joinRoom(inquiry.id);
      }

      socketClient.sendMessage(inquiry.id, messageContent);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      if (error instanceof Error) {
        if (error.message.includes('네트워크') || error.message.includes('Network')) {
          toast.error('네트워크 오류가 발생했습니다.');
        } else {
          toast.error(error.message || '메시지 전송에 실패했습니다.');
        }
      } else {
        toast.error('메시지 전송에 실패했습니다.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Enter 키 핸들러 (Shift+Enter는 줄바꿈)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 메시지 수정 시작
  const handleStartEdit = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  };

  // 메시지 수정 취소
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // 메시지 수정 저장
  const handleSaveEdit = async (messageId: string) => {
    const content = editContent.trim();
    
    if (!content) {
      toast.error('메시지 내용을 입력해주세요.');
      return;
    }

    if (content.length > 1500) {
      toast.error('메시지는 최대 1500자까지 입력할 수 있습니다.');
      return;
    }

    try {
      await updateMessage(inquiry.id, messageId, { content });
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content, isEditing: false } : msg
        )
      );
      
      setEditingMessageId(null);
      setEditContent('');
      toast.success('메시지가 수정되었습니다.');
    } catch (error) {
      console.error('메시지 수정 실패:', error);
      toast.error('메시지 수정에 실패했습니다.');
    }
  };

  // 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('정말 이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteMessage(inquiry.id, messageId);
      
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success('메시지가 삭제되었습니다.');
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
      toast.error('메시지 삭제에 실패했습니다.');
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: InquiryStatus) => {
    if (isUpdatingStatus || newStatus === currentStatus) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await updateInquiryStatus(inquiry.id, { status: newStatus });
      setCurrentStatus(newStatus);
      toast.success('문의 상태가 변경되었습니다.');
      
      // 부모 컴포넌트에 상태 변경 알림
      if (onStatusChange) {
        onStatusChange(inquiry.id, newStatus);
      }
    } catch (err) {
      console.error('문의 상태 변경 실패:', err);
      if (err instanceof Error && err.message.includes('처리 중')) {
        toast.error('다른 관리자가 처리 중입니다.');
      } else {
        toast.error('문의 상태 변경에 실패했습니다.');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 상태 표시 함수들
  const getStatusLabel = (status: InquiryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'IN_PROGRESS':
        return '처리중';
      case 'ON_HOLD':
        return '보류';
      case 'PENDING':
        return '대기중';
      default:
        return status;
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusDone;
      case 'IN_PROGRESS':
        return styles.statusProcessing;
      case 'ON_HOLD':
        return styles.statusWaiting;
      case 'PENDING':
        return styles.statusWaiting;
      default:
        return styles.statusDefault;
    }
  };

  // 닫기 핸들러
  const handleClose = () => {
    const socketClient = socketClientRef.current;
    socketClient.leaveRoom(inquiry.id);
    socketClient.disconnect();
    onClose();
  };

  return (
    <div className={styles.c_1er3iqn}>
      {/* Header */}
      <div className={styles.c_1hlwyim}>
        <div className={styles.c_2ca09x}>
          <div className={styles.c_1oa1gq1}>
            {inquiry.user.nickname.charAt(0)}
          </div>
          <div>
            <div className={styles.headerTitleRow}>
              <h3 className={styles.c_we5pmo}>{inquiry.user.nickname}</h3>
              <span className={`${styles.statusBadge} ${getStatusColor(currentStatus)}`}>
                {getStatusLabel(currentStatus)}
              </span>
            </div>
            {inquiry.user.email && (
              <p className={styles.c_ibg1vp}>{inquiry.user.email}</p>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Select
            value={currentStatus}
            onValueChange={(value) => handleStatusChange(value as InquiryStatus)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className={styles.statusSelectTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">대기중</SelectItem>
              <SelectItem value="IN_PROGRESS">처리중</SelectItem>
              <SelectItem value="ON_HOLD">보류</SelectItem>
              <SelectItem value="COMPLETED">완료</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleClose}
            className={styles.c_1us4dfh}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Last Message Preview */}
      {inquiry.lastMessagePreview && (
        <div className={styles.c_1e5xuuz}>
          <p className={styles.c_ibg2me}>최근 메시지</p>
          <p className={styles.c_1rg4z9e}>{inquiry.lastMessagePreview}</p>
        </div>
      )}

      {/* Messages */}
      <div className={styles.c_1g2rryz} ref={messagesContainerRef}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.loader} size={24} />
            <p>채팅 내역을 불러오는 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>아직 메시지가 없습니다.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageRow} ${
                message.senderType === 'ADMIN'
                  ? styles.messageRowAdmin
                  : styles.messageRowUser
              }`}
            >
              <div
                className={`${styles.messageBubble} ${
                  message.senderType === 'ADMIN'
                    ? styles.messageBubbleAdmin
                    : styles.messageBubbleUser
                }`}
              >
                {editingMessageId === message.id ? (
                  <div className={styles.editContainer}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={styles.editTextarea}
                      rows={3}
                      maxLength={1500}
                    />
                    <div className={styles.editActions}>
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className={styles.editSaveButton}
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={styles.editCancelButton}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.c_ketwm6}>{message.content}</p>
                    <div className={styles.messageFooter}>
                      <p
                        className={`${styles.messageTime} ${
                          message.senderType === 'ADMIN'
                            ? styles.messageTimeAdmin
                            : styles.messageTimeUser
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                      {message.senderType === 'ADMIN' && (
                        <div className={styles.messageActions}>
                          <button
                            onClick={() =>
                              handleStartEdit(message.id, message.content)
                            }
                            className={styles.messageActionButton}
                            aria-label="메시지 수정"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className={styles.messageActionButton}
                            aria-label="메시지 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.c_cnx530}>
        <div className={styles.c_3pq6bm}>
          <button className={styles.c_1us4dfh} aria-label="파일 첨부">
            <Paperclip size={20} className={styles.c_1cnlnvv} />
          </button>
          <div className={styles.c_1dzu82l}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
              className={styles.c_199bjjd}
              rows={2}
              maxLength={1500}
              disabled={isSending}
              aria-label="메시지 입력"
            />
            {newMessage.length > 0 && (
              <p className={styles.charCount}>
                {newMessage.length}/1500
              </p>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className={styles.c_ybeyki}
            aria-label="메시지 전송"
          >
            {isSending ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}