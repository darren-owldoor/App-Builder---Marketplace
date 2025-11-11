import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import HomeAlt from "./pages/HomeAlt";
import HomeNew from "./pages/HomeNew";
import ForAgents from "./pages/ForAgents";
import AgentsOld from "./pages/AgentsOld";
import ForBrokerages from "./pages/ForBrokerages";
import ForMortgage from "./pages/ForMortgage";
import MortgageProfessionals from "./pages/MortgageProfessionals";
import RealEstateReferrals from "./pages/RealEstateReferrals";
import Teams from "./pages/Teams";
import RealtorRecruitmentLeads from "./pages/RealtorRecruitmentLeads";
import NotFound from "./pages/NotFound";
import AuthPage from "./components/auth/AuthPage";
import PasswordReset from "./pages/PasswordReset";
import SetNewPassword from "./pages/SetNewPassword";
import ClientSignUp from "./pages/ClientSignUp";
import TeamSignUp from "./pages/TeamSignUp";
import AgentSignUp from "./pages/AgentSignUp";
import Agents from "./pages/Agents";
import AgentProfile from "./pages/AgentProfile";
import PublicAgentProfile from "./pages/PublicAgentProfile";
import AgentSettings from "./pages/AgentSettings";
import EditAgentProfile from "./pages/EditAgentProfile";
import EditAgentProfileNew from "./pages/EditAgentProfileNew";
import EditTeamProfile from "./pages/EditTeamProfile";
import TeamProfile from "./pages/TeamProfile";
import RealEstateAgents from "./pages/RealEstateAgents";
import Join from "./pages/Join";
import JoinRealEstate from "./pages/JoinRealEstate";
import JoinMortgage from "./pages/JoinMortgage";
import JoinRealEstateAgent from "./pages/JoinRealEstateAgent";
import JoinMortgageLO from "./pages/JoinMortgageLO";
import ApplicationPending from "./pages/ApplicationPending";
import AgentChat from "./pages/AgentChat";
import DynamicOnboarding from "./pages/DynamicOnboarding";
import AdminDashboard from "./pages/AdminDashboard";
import AdminErrorLogs from "./pages/AdminErrorLogs";
import AdminBackfillZips from "./pages/AdminBackfillZips";
import AdminRedirects from "./pages/AdminRedirects";
import AdminFieldDefinitions from "./pages/AdminFieldDefinitions";
import SystemMonitoringDashboard from "./pages/SystemMonitoringDashboard";
import AdminCredits from "./pages/AdminCredits";
import SyncSchemaFix from "./pages/SyncSchemaFix";
import ClientsDirectory from "./pages/ClientsDirectory";
import PublicClientProfile from "./pages/PublicClientProfile";
import StaffDashboard from "./pages/StaffDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ClientDashboardNew from "./pages/ClientDashboardNew";
import AIRecruiter from "./pages/AIRecruiter";
import ClientDashboardMockup from "./pages/ClientDashboardMockup";
import ClientDashboardMainMockup from "./pages/ClientDashboardMainMockup";
import ClientRecruits from "./pages/ClientRecruits";
import ClientBackend from "./pages/ClientBackend";
import BrokerDashboard from "./pages/BrokerDashboard";
import ClientLeads from "./pages/ClientLeads";
import ClientMatchRedirect from "./pages/ClientMatchRedirect";
import ClientProfile from "./pages/ClientProfile";
import AutoRecruitDashboard from "./pages/AutoRecruitDashboard";
import AIRecruiterDashboard from "./pages/AIRecruiterDashboard";
import HotLeads from "./pages/HotLeads";
import ClientBilling from "./pages/ClientBilling";
import LeadDashboard from "./pages/LeadDashboard";
import ProDashboard from "./pages/ProDashboard";
import CampaignManagement from "./pages/CampaignManagement";
import ClientCampaigns from "./pages/ClientCampaigns";
import Conversations from "./pages/Conversations";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminErrorDashboard from "./pages/AdminErrorDashboard";
import ImportClients from "./pages/ImportClients";
import ImportLeads from "./pages/ImportLeads";
import DirectoryUpload from "./pages/DirectoryUpload";
// import AIOnboarding from "./pages/AIOnboarding"; // Disabled
import ClientDetail from "./pages/ClientDetail";
import EmailTemplates from "./pages/EmailTemplates";
import SMSTemplates from "./pages/SMSTemplates";
import Support from "./pages/Support";
import Packages from "./pages/Packages";
import PackageView from "./pages/PackageView";
import Payments from "./pages/Payments";
import Story from "./pages/Story";
import AIPrompts from "./pages/AIPrompts";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManagement from "./pages/BlogManagement";
import OurTeam from "./pages/OurTeam";
import UserSettings from "./pages/UserSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SMSTerms from "./pages/SMSTerms";
import FindBrokerage from "./pages/FindBrokerage";
import UpdateJasonLeads from "./pages/UpdateJasonLeads";
import Match from "./pages/Match";
import Matching from "./pages/Matching";
import Matches from "./pages/Matches";
import MortgageMatching from "./pages/MortgageMatching";
import OverpassStyle from "./pages/OverpassStyle";
import AgentMap from "./pages/AgentMap";
import AgentDirectory from "./pages/AgentDirectory";
import PublicAgentDirectory from "./pages/PublicAgentDirectory";
import MarketCoverage from "./pages/MarketCoverage";
import MarketCoverageCities from "./pages/MarketCoverageCities";
import MarketCoverageRadius from "./pages/MarketCoverageRadius";
import MarketCoverageDraw from "./pages/MarketCoverageDraw";
import MarketCoverageZipRadius from "./pages/MarketCoverageZipRadius";
import CoverageQualityDashboard from "./pages/CoverageQualityDashboard";
import CoverageAnalyticsDashboard from "./pages/CoverageAnalyticsDashboard";
import ZipRadiusSearch from "./pages/ZipRadiusSearch";
import MagicLinkLogin from "./pages/MagicLinkLogin";
import MagicLink from "./pages/MagicLink";
import VerifyCode from "./pages/VerifyCode";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Calendar from "./pages/Calendar";
import SMSOptIn from "./pages/SMSOptIn";
import SMSConsentDocumentation from "./pages/SMSConsentDocumentation";
import Dashboard from "./pages/Dashboard";
import TeamDashboard from "./pages/TeamDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import FieldManagement from "./pages/FieldManagement";
import SmartQualification from "./pages/SmartQualification";
import AIProviderTester from "./components/admin/AIProviderTester";
import Onboarding from "./pages/Onboarding";
import ClientOnboarding from "./pages/ClientOnboarding";
import ClientOnboardingMinimum from "./pages/ClientOnboardingMinimum";
import Pricing from "./pages/Pricing";
import RefundPolicy from "./pages/RefundPolicy";
import Contact from "./pages/Contact";
import PaymentSetup from "./pages/PaymentSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeAlt />} />
          <Route path="/real-estate-network" element={<HomeNew />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/team-dashboard" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
          <Route path="/agent-dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
          <Route
            path="/client-onboarding"
            element={
              <ProtectedRoute>
                <ClientOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-start"
            element={
              <ProtectedRoute>
                <ClientOnboardingMinimum />
              </ProtectedRoute>
            }
          />
          {/* Redirect /client to /dashboard */}
          <Route path="/client" element={<Navigate to="/dashboard" replace />} />
          <Route path="/client/*" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />
          <Route path="/apply" element={<ClientSignUp />} />
          <Route path="/team-signup" element={<TeamSignUp />} />
          <Route path="/agent-signup" element={<AgentSignUp />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/map" element={<AgentMap />} />
          <Route path="/directory" element={<PublicAgentDirectory />} />
          <Route path="/agent-directory" element={<ProtectedRoute><AgentDirectory /></ProtectedRoute>} />
          <Route path="/Real-Estate-Agents" element={<RealEstateAgents />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/real-estate" element={<JoinRealEstate />} />
          <Route path="/join/mortgage" element={<JoinMortgage />} />
          <Route path="/join/real-estate-agent" element={<JoinRealEstateAgent />} />
          <Route path="/join/mortgage/lo" element={<JoinMortgageLO />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/magic-link" element={<MagicLinkLogin />} />
          <Route path="/application-pending" element={<ApplicationPending />} />
          <Route path="/agent-chat" element={<AgentChat />} />
          <Route path="/agent-profile" element={<AgentProfile />} />
          <Route path="/edit-agent-profile" element={<AgentProfile />} />
          <Route path="/agent-profile/settings" element={<ProtectedRoute><AgentSettings /></ProtectedRoute>} />
          <Route path="/profile/:profileId" element={<PublicAgentProfile />} />
          <Route path="/edit-agent-profile" element={<ProtectedRoute><EditAgentProfileNew /></ProtectedRoute>} />
          <Route path="/team-profile" element={<TeamProfile />} />
          <Route path="/edit-team-profile" element={<ProtectedRoute><EditTeamProfile /></ProtectedRoute>} />
          <Route path="/directory-upload" element={<ProtectedRoute><DirectoryUpload /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/story" element={<Story />} />
          <Route path="/for-agents" element={<ForAgents />} />
          <Route path="/agents-old" element={<AgentsOld />} />
          <Route path="/realtor-recruitment-leads" element={<RealtorRecruitmentLeads />} />
          <Route path="/for-mortgage" element={<ForMortgage />} />
          <Route path="/real-estate-referrals" element={<RealEstateReferrals />} />
          <Route path="/mortgage" element={<MortgageProfessionals />} />
          <Route path="/for-brokerages" element={<Teams />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/find-brokerage" element={<FindBrokerage />} />
          <Route path="/match" element={<Match />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/ai-recruiter" element={<ProtectedRoute><AIRecruiter /></ProtectedRoute>} />
          <Route path="/mortgage-matching" element={<MortgageMatching />} />
          <Route path="/overpass-style" element={<OverpassStyle />} />
          <Route
            path="/market-coverage"
            element={
              <ProtectedRoute>
                <MarketCoverage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market-coverage/cities"
            element={
              <ProtectedRoute>
                <MarketCoverageCities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market-coverage/radius"
            element={
              <ProtectedRoute>
                <MarketCoverageRadius />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market-coverage/draw"
            element={
              <ProtectedRoute>
                <MarketCoverageDraw />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market-coverage/zip-radius"
            element={
              <ProtectedRoute>
                <MarketCoverageZipRadius />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coverage-quality"
            element={
              <AdminProtectedRoute>
                <CoverageQualityDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/coverage-analytics"
            element={
              <ProtectedRoute>
                <CoverageAnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/zip-radius-search"
            element={
              <ProtectedRoute>
                <ZipRadiusSearch />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/sms-terms" element={<SMSTerms />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/payment-setup/:token" element={<PaymentSetup />} />
          <Route path="/package/:token" element={<PackageView />} />
          <Route path="/sms-opt-in" element={<SMSOptIn />} />
          <Route path="/sms-consent-documentation" element={<SMSConsentDocumentation />} />
          <Route path="/smart-qualification" element={<SmartQualification />} />
          <Route path="/companies" element={<ClientsDirectory />} />
          <Route path="/company/:clientId" element={<PublicClientProfile />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <AdminProtectedRoute>
                <SystemMonitoringDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/credits"
            element={
              <AdminProtectedRoute>
                <AdminCredits />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/backfill-zips"
            element={
              <AdminProtectedRoute>
                <AdminBackfillZips />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/sync-schema-fix"
            element={
              <AdminProtectedRoute>
                <SyncSchemaFix />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/update-jason-leads"
            element={
              <AdminProtectedRoute>
                <UpdateJasonLeads />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker"
            element={
              <ProtectedRoute>
                <BrokerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office"
            element={
              <ProtectedRoute>
                <ClientBackend />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-2"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-new"
            element={
              <ProtectedRoute>
                <ClientDashboardNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-old"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-mockup"
            element={<ClientDashboardMockup />}
          />
          <Route
            path="/office/recruits"
            element={
              <ProtectedRoute>
                <ClientRecruits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office/leads"
            element={
              <ProtectedRoute>
                <ClientLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office/match/:id"
            element={
              <ProtectedRoute>
                <ClientMatchRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office-profile"
            element={
              <ProtectedRoute>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office-recruits"
            element={
              <ProtectedRoute>
                <ClientRecruits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auto-recruit"
            element={
              <ProtectedRoute>
                <AutoRecruitDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-recruiter"
            element={
              <ProtectedRoute>
                <AIRecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hot-leads"
            element={
              <ProtectedRoute>
                <HotLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-backend"
            element={
              <ProtectedRoute>
                <ClientBackend />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office-billing"
            element={
              <ProtectedRoute>
                <ClientBilling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lead"
            element={
              <ProtectedRoute>
                <ProDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro"
            element={
              <ProtectedRoute>
                <ProDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import-clients"
            element={
              <ProtectedRoute>
                <ImportClients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import-leads"
            element={
              <ProtectedRoute>
                <ImportLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <CampaignManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/office-campaigns"
            element={
              <ProtectedRoute>
                <ClientCampaigns />
              </ProtectedRoute>
            }
          />
          {/* AI Onboarding disabled - security risk */}
          <Route
            path="/admin/client/:clientId"
            element={
              <AdminProtectedRoute>
                <ClientDetail />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/conversations"
            element={
              <AdminProtectedRoute>
                <Conversations />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/office/conversations"
            element={
              <ProtectedRoute>
                <Conversations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <AdminProtectedRoute>
                <AdminIntegrations />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/errors"
            element={
              <AdminProtectedRoute>
                <AdminErrorDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/error-logs"
            element={
              <AdminProtectedRoute>
                <AdminErrorLogs />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/redirects"
            element={
              <AdminProtectedRoute>
                <AdminRedirects />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/fields"
            element={
              <AdminProtectedRoute>
                <AdminFieldDefinitions />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/field-management"
            element={
              <AdminProtectedRoute>
                <FieldManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-tester"
            element={
              <AdminProtectedRoute>
                <AIProviderTester />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-tester"
            element={
              <AdminProtectedRoute>
                <AIProviderTester />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/email-templates"
            element={
              <ProtectedRoute>
                <EmailTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms-templates"
            element={
              <ProtectedRoute>
                <SMSTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <AdminProtectedRoute>
                <Packages />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <AdminProtectedRoute>
                <Payments />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/ai-prompts"
            element={
              <ProtectedRoute>
                <AIPrompts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog-management"
            element={
              <ProtectedRoute>
                <BlogManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
