import WalletView from './WalletView';
import React, { useState } from 'react';
import { AppUser } from '../../types';
import MainMenuView from './MainMenuView';
import SettingsView from './SettingsView';
import EditProfileView from './EditProfileView';
import LevelView from './LevelView';
import AccessoriesView from './AccessoriesView';
import SupportView from './SupportView';
import AccountLinkView from './AccountLinkView';
import VipView from './VipView';
import CoinAgentPortalView from './CoinAgentPortalView';
import AgencyPortalView from './AgencyPortalView';
import SocialListView from './SocialListView';
import FullUserProfileView from './FullUserProfileView';

interface Props {
  setCurrentScreen: (val: string) => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onToggleFollow: (targetUser: AppUser) => Promise<void>;
  supportTickets: any[];
  setIsSupportAdminModalOpen: (val: boolean) => void;
  setIsAdminManageModalOpen: (val: boolean) => void;
  setSupportChatOpen: (val: boolean) => void;
  setIsProfileModalOpen: (val: boolean) => void;
  setSelectedProfileUser: (val: AppUser | null) => void;
  setIsEditingBio: (val: boolean) => void;
  setBioEditValue: (val: string) => void;
  onEnterMyRoom: () => void;
}

export default function ProfileIndex(props: Props) {
  const [activeView, setActiveView] = useState<string>('main');
  const [initialLevelTab, setInitialLevelTab] = useState<'wealth' | 'popular'>('wealth');
  const [initialSocialTab, setInitialSocialTab] = useState<'friends' | 'followers' | 'following'>('friends');

  const handleNavigate = (view: string) => {
    if (view === 'my_room') {
      props.onEnterMyRoom();
    } else if (view === 'level_wealth') {
      setInitialLevelTab('wealth');
      setActiveView('level');
    } else if (view === 'level_popular') {
      setInitialLevelTab('popular');
      setActiveView('level');
    } else if (view === 'social_friends') {
      setInitialSocialTab('friends');
      setActiveView('social_lists');
    } else if (view === 'social_followers') {
      setInitialSocialTab('followers');
      setActiveView('social_lists');
    } else if (view === 'social_following') {
      setInitialSocialTab('following');
      setActiveView('social_lists');
    } else {
      setActiveView(view);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'wallet':
        return <WalletView onBack={() => setActiveView('main')} currentUser={props.currentUser} users={props.users} />;
      case 'main':
        return <MainMenuView onNavigate={handleNavigate} {...props} />;
      case 'settings':
        return <SettingsView onBack={() => setActiveView('main')} currentUser={props.currentUser} />;
      case 'edit_profile':
        return <EditProfileView onBack={() => setActiveView('main')} {...props} />;
      case 'level':
        return <LevelView onBack={() => setActiveView('main')} currentUser={props.currentUser} initialTab={initialLevelTab} />;
      case 'accessories':
        return <AccessoriesView onBack={() => setActiveView('main')} currentUser={props.currentUser} />;
      case 'support':
        return <SupportView onBack={() => setActiveView('main')} {...props} />;
      case 'link_account':
        return <AccountLinkView onBack={() => setActiveView('main')} currentUser={props.currentUser} />;
      case 'vip':
        return <VipView onBack={() => setActiveView('main')} currentUser={props.currentUser} />;
      case 'coin_agent_portal':
        return <CoinAgentPortalView onBack={() => setActiveView('main')} currentUser={props.currentUser} users={props.users} />;
      case 'agency_portal':
        return <AgencyPortalView onBack={() => setActiveView('main')} currentUser={props.currentUser} users={props.users} />;
      case 'social_lists':
        return (
          <SocialListView 
            onBack={() => setActiveView('main')} 
            currentUser={props.currentUser} 
            users={props.users} 
            onToggleFollow={props.onToggleFollow}
            setIsProfileModalOpen={props.setIsProfileModalOpen}
            setSelectedProfileUser={props.setSelectedProfileUser}
          />
        );
      case 'full_profile':
        return (
          <FullUserProfileView 
            onBack={() => setActiveView('main')} 
            currentUser={props.currentUser} 
            users={props.users} 
            onNavigate={handleNavigate}
          />
        );
      default:
        // Handle unimplemented routes by returning to main
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-slate-500 font-bold">هذه الصفحة قيد التطوير</p>
            <button onClick={() => setActiveView('main')} className="bg-amber-500 text-white px-4 py-2 rounded-full font-bold">العودة</button>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col relative animate-fade-in ">
      {renderView()}
    </div>
  );
}
