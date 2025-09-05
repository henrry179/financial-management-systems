import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthStatusIndicator from '../AuthStatusIndicator';
import { useAuthStore } from '../../../store/auth';

// Mock the auth store
vi.mock('../../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const MockedAuthStore = useAuthStore as any;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login button when user is not authenticated', () => {
    MockedAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render user info when user is authenticated', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    MockedAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render user email when username is not available', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    MockedAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should handle logout when user clicks logout', () => {
    const mockLogout = vi.fn();
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };

    MockedAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: mockLogout,
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    // Click on user button to open dropdown
    const userButton = screen.getByRole('button');
    fireEvent.click(userButton);
    
    // Find and click logout option
    const logoutOption = screen.getByText('退出登录');
    fireEvent.click(logoutOption);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show user avatar when available', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
    };

    MockedAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show default avatar when user avatar is not available', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };

    MockedAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    // Should show default user icon instead of img
    const avatar = screen.getByRole('button');
    expect(avatar).toBeInTheDocument();
  });

  it('should navigate to login page when login button is clicked', () => {
    MockedAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    renderWithRouter(<AuthStatusIndicator />);
    
    const loginButton = screen.getByText('登录');
    expect(loginButton.closest('a')).toHaveAttribute('href', '/auth/login');
  });
});
