import { GraduationCap, Calendar, Wifi, BookOpen, Building2, Users, Briefcase, CreditCard, Phone, HelpCircle, FileText, Award, Library, Home, Coffee } from 'lucide-react';

export interface Suggestion {
    id: string;
    text: string;
    shortText: string;
    icon: React.ElementType;
    category: string;
}

// Danh sách các câu hỏi gợi ý được trích xuất từ nlu.yml
export const suggestions: Suggestion[] = [
    // Tuyển sinh
    {
        id: 'tuyen-sinh-1',
        text: 'Các phương thức xét tuyển năm 2025 là gì?',
        shortText: 'Phương thức xét tuyển 2025',
        icon: GraduationCap,
        category: 'Tuyển sinh',
    },
    {
        id: 'tuyen-sinh-2',
        text: 'Điểm chuẩn dự kiến năm nay là bao nhiêu?',
        shortText: 'Điểm chuẩn dự kiến',
        icon: GraduationCap,
        category: 'Tuyển sinh',
    },
    {
        id: 'tuyen-sinh-3',
        text: 'Chỉ tiêu tuyển sinh năm 2025 là bao nhiêu?',
        shortText: 'Chỉ tiêu tuyển sinh 2025',
        icon: GraduationCap,
        category: 'Tuyển sinh',
    },
    {
        id: 'tuyen-sinh-4',
        text: 'Các tổ hợp xét tuyển năm 2025 là gì?',
        shortText: 'Tổ hợp xét tuyển',
        icon: GraduationCap,
        category: 'Tuyển sinh',
    },
    {
        id: 'tuyen-sinh-5',
        text: 'Đăng ký xét tuyển như thế nào?',
        shortText: 'Cách đăng ký xét tuyển',
        icon: FileText,
        category: 'Tuyển sinh',
    },
    {
        id: 'tuyen-sinh-6',
        text: 'Điểm sàn năm nay bao nhiêu?',
        shortText: 'Điểm sàn xét tuyển',
        icon: GraduationCap,
        category: 'Tuyển sinh',
    },

    // Học phí & Học bổng
    {
        id: 'hoc-phi-1',
        text: 'Học phí một năm là bao nhiêu?',
        shortText: 'Học phí',
        icon: CreditCard,
        category: 'Học phí',
    },
    {
        id: 'hoc-phi-2',
        text: 'Trường có những loại học bổng nào?',
        shortText: 'Chính sách học bổng',
        icon: Award,
        category: 'Học phí',
    },
    {
        id: 'hoc-phi-3',
        text: 'Có hỗ trợ vay vốn ngân hàng không?',
        shortText: 'Vay vốn sinh viên',
        icon: CreditCard,
        category: 'Học phí',
    },

    // Ngành học
    {
        id: 'nganh-1',
        text: 'Sinh viên ngành ATTT ra trường làm gì?',
        shortText: 'Việc làm ngành ATTT',
        icon: Briefcase,
        category: 'Ngành học',
    },
    {
        id: 'nganh-2',
        text: 'Sinh viên ngành CNTT ra trường làm gì?',
        shortText: 'Việc làm ngành CNTT',
        icon: Briefcase,
        category: 'Ngành học',
    },
    {
        id: 'nganh-3',
        text: 'Sinh viên ngành KTĐTVT ra trường làm gì?',
        shortText: 'Việc làm ngành KTĐTVT',
        icon: Briefcase,
        category: 'Ngành học',
    },
    {
        id: 'nganh-4',
        text: 'Ngành CNTT có các chuyên ngành hẹp nào?',
        shortText: 'Chuyên ngành CNTT',
        icon: BookOpen,
        category: 'Ngành học',
    },
    {
        id: 'nganh-5',
        text: 'Ngành ATTT có chuyên ngành hẹp gì?',
        shortText: 'Chuyên ngành ATTT',
        icon: BookOpen,
        category: 'Ngành học',
    },
    {
        id: 'nganh-6',
        text: 'Em có thể chuyển ngành không?',
        shortText: 'Chuyển ngành',
        icon: BookOpen,
        category: 'Ngành học',
    },

    // Cơ sở vật chất
    {
        id: 'csvc-1',
        text: 'Trường có ký túc xá không?',
        shortText: 'Ký túc xá',
        icon: Home,
        category: 'Cơ sở vật chất',
    },
    {
        id: 'csvc-2',
        text: 'Thư viện có những gì?',
        shortText: 'Thư viện trường',
        icon: Library,
        category: 'Cơ sở vật chất',
    },
    {
        id: 'csvc-3',
        text: 'Có căng tin trong trường không?',
        shortText: 'Căng tin',
        icon: Coffee,
        category: 'Cơ sở vật chất',
    },
    {
        id: 'csvc-4',
        text: 'Trường có bao nhiêu cơ sở đào tạo?',
        shortText: 'Cơ sở đào tạo',
        icon: Building2,
        category: 'Cơ sở vật chất',
    },
    {
        id: 'csvc-5',
        text: 'Có phòng nghiên cứu, phòng lab không?',
        shortText: 'Phòng nghiên cứu',
        icon: Building2,
        category: 'Cơ sở vật chất',
    },

    // Đời sống sinh viên
    {
        id: 'sv-1',
        text: 'Có câu lạc bộ nào trong trường?',
        shortText: 'Câu lạc bộ sinh viên',
        icon: Users,
        category: 'Đời sống SV',
    },
    {
        id: 'sv-2',
        text: 'Trường có hoạt động giải trí gì?',
        shortText: 'Hoạt động giải trí',
        icon: Users,
        category: 'Đời sống SV',
    },
    {
        id: 'sv-3',
        text: 'Quy định ra vào học viện thế nào?',
        shortText: 'Quy định ra vào',
        icon: Building2,
        category: 'Đời sống SV',
    },

    // Nhập học
    {
        id: 'nhap-hoc-1',
        text: 'Khi nhập học cần chuẩn bị giấy tờ gì?',
        shortText: 'Hồ sơ nhập học',
        icon: FileText,
        category: 'Nhập học',
    },
    {
        id: 'nhap-hoc-2',
        text: 'Khi nhập học có cần người giám hộ đi cùng không?',
        shortText: 'Người giám hộ nhập học',
        icon: Users,
        category: 'Nhập học',
    },

    // Thông tin chung
    {
        id: 'chung-1',
        text: 'Cho em xin thông tin chung về trường?',
        shortText: 'Thông tin về trường',
        icon: Building2,
        category: 'Thông tin chung',
    },
    {
        id: 'chung-2',
        text: 'Em muốn được tư vấn đăng ký thì liên hệ ở đâu?',
        shortText: 'Hotline tư vấn',
        icon: Phone,
        category: 'Thông tin chung',
    },
    {
        id: 'chung-3',
        text: 'Có chính sách ưu tiên nào không?',
        shortText: 'Chính sách ưu tiên',
        icon: Award,
        category: 'Thông tin chung',
    },

    // Đào tạo
    {
        id: 'dao-tao-1',
        text: 'Trường đào tạo hệ gì?',
        shortText: 'Hệ đào tạo',
        icon: GraduationCap,
        category: 'Đào tạo',
    },
    {
        id: 'dao-tao-2',
        text: 'Trường có tuyển sinh sau đại học không?',
        shortText: 'Sau đại học',
        icon: GraduationCap,
        category: 'Đào tạo',
    },
    {
        id: 'dao-tao-3',
        text: 'Có được học song ngành không?',
        shortText: 'Học song ngành',
        icon: BookOpen,
        category: 'Đào tạo',
    },
    {
        id: 'dao-tao-4',
        text: 'Học viện có đào tạo liên thông không?',
        shortText: 'Liên thông',
        icon: GraduationCap,
        category: 'Đào tạo',
    },

    // Khác
    {
        id: 'khac-1',
        text: 'Sinh viên có được cấp giáo trình không?',
        shortText: 'Giáo trình học tập',
        icon: BookOpen,
        category: 'Khác',
    },
    {
        id: 'khac-2',
        text: 'Có cộng điểm chứng chỉ tiếng Anh không?',
        shortText: 'Cộng điểm IELTS/TOEIC',
        icon: Award,
        category: 'Khác',
    },
    {
        id: 'khac-3',
        text: 'Wifi trường password là gì?',
        shortText: 'Wifi trường',
        icon: Wifi,
        category: 'Khác',
    },
    {
        id: 'khac-4',
        text: 'Làm sao để xem lịch thi của tôi?',
        shortText: 'Xem lịch thi',
        icon: Calendar,
        category: 'Khác',
    },
    {
        id: 'khac-5',
        text: 'Bảng xếp loại theo thang điểm 4?',
        shortText: 'Thang điểm 4',
        icon: HelpCircle,
        category: 'Khác',
    },
];

/**
 * Lấy ngẫu nhiên n suggestions
 */
export function getRandomSuggestions(count: number = 4): Suggestion[] {
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Lấy suggestions theo category
 */
export function getSuggestionsByCategory(category: string): Suggestion[] {
    return suggestions.filter((s) => s.category === category);
}

/**
 * Lấy tất cả categories
 */
export function getAllCategories(): string[] {
    return [...new Set(suggestions.map((s) => s.category))];
}
