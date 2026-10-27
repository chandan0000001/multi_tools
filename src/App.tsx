import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Catalogues (Lazy Loaded)
const NormalUserCatalogue = lazy(() =>
  import('./pages/NormalUserCatalogue').then((m) => ({ default: m.NormalUserCatalogue }))
);
const DevelopersCatalogue = lazy(() =>
  import('./pages/DevelopersCatalogue').then((m) => ({ default: m.DevelopersCatalogue }))
);

// Informational Pages
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Normal User Tools
const CalculatorTool = lazy(() =>
  import('./pages/normal/CalculatorTool').then((m) => ({ default: m.CalculatorTool }))
);
const ImageTools = lazy(() =>
  import('./pages/normal/ImageTools').then((m) => ({ default: m.ImageTools }))
);
const PdfTools = lazy(() =>
  import('./pages/normal/PdfTools').then((m) => ({ default: m.PdfTools }))
);
const QrGeneratorTool = lazy(() =>
  import('./pages/normal/QrGeneratorTool').then((m) => ({ default: m.QrGeneratorTool }))
);
const PasswordGeneratorTool = lazy(() =>
  import('./pages/normal/PasswordGeneratorTool').then((m) => ({ default: m.PasswordGeneratorTool }))
);
const WordCounterTool = lazy(() =>
  import('./pages/normal/WordCounterTool').then((m) => ({ default: m.WordCounterTool }))
);
const SpeedTestTool = lazy(() =>
  import('./pages/normal/SpeedTestTool').then((m) => ({ default: m.SpeedTestTool }))
);
const IpCheckerTool = lazy(() =>
  import('./pages/normal/IpCheckerTool').then((m) => ({ default: m.IpCheckerTool }))
);
const TimezoneTool = lazy(() =>
  import('./pages/normal/TimezoneTool').then((m) => ({ default: m.TimezoneTool }))
);

// Developer Tools
const JsonFormatterTool = lazy(() =>
  import('./pages/dev/JsonFormatterTool').then((m) => ({ default: m.JsonFormatterTool }))
);
const Base64Tool = lazy(() =>
  import('./pages/dev/Base64Tool').then((m) => ({ default: m.Base64Tool }))
);
const UrlEncoderTool = lazy(() =>
  import('./pages/dev/UrlEncoderTool').then((m) => ({ default: m.UrlEncoderTool }))
);
const RegexTesterTool = lazy(() =>
  import('./pages/dev/RegexTesterTool').then((m) => ({ default: m.RegexTesterTool }))
);
const HashCalculatorTool = lazy(() =>
  import('./pages/dev/HashCalculatorTool').then((m) => ({ default: m.HashCalculatorTool }))
);
const JwtDecoderTool = lazy(() =>
  import('./pages/dev/JwtDecoderTool').then((m) => ({ default: m.JwtDecoderTool }))
);
const UuidGeneratorTool = lazy(() =>
  import('./pages/dev/UuidGeneratorTool').then((m) => ({ default: m.UuidGeneratorTool }))
);
const MarkdownPreviewTool = lazy(() =>
  import('./pages/dev/MarkdownPreviewTool').then((m) => ({ default: m.MarkdownPreviewTool }))
);
const SeoTools = lazy(() =>
  import('./pages/dev/SeoTools').then((m) => ({ default: m.SeoTools }))
);
const RobotsSitemapTool = lazy(() =>
  import('./pages/dev/RobotsSitemapTool').then((m) => ({ default: m.RobotsSitemapTool }))
);

const PageFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
    <Loader2 className="w-7 h-7 animate-spin text-slate-700 dark:text-slate-300" />
    <span className="text-xs font-medium text-slate-500">Loading utility...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Section 4: Immediately redirect / to /normalUser */}
          <Route path="/" element={<Navigate to="/normalUser" replace />} />

          {/* Normal User Routes */}
          <Route path="/normalUser" element={<NormalUserCatalogue />} />
          <Route path="/normalUser/calculator" element={<CalculatorTool />} />
          <Route path="/normalUser/image-tools" element={<ImageTools />} />
          <Route path="/normalUser/pdf-tools" element={<PdfTools />} />
          <Route path="/normalUser/qr-generator" element={<QrGeneratorTool />} />
          <Route path="/normalUser/password-generator" element={<PasswordGeneratorTool />} />
          <Route path="/normalUser/word-counter" element={<WordCounterTool />} />
          <Route path="/normalUser/speed-test" element={<SpeedTestTool />} />
          <Route path="/normalUser/ip-checker" element={<IpCheckerTool />} />
          <Route path="/normalUser/timezone" element={<TimezoneTool />} />

          {/* Developer Routes */}
          <Route path="/developers" element={<DevelopersCatalogue />} />
          <Route path="/developers/json-formatter" element={<JsonFormatterTool />} />
          <Route path="/developers/base64" element={<Base64Tool />} />
          <Route path="/developers/url-encoder" element={<UrlEncoderTool />} />
          <Route path="/developers/regex-tester" element={<RegexTesterTool />} />
          <Route path="/developers/hash-calculator" element={<HashCalculatorTool />} />
          <Route path="/developers/jwt-decoder" element={<JwtDecoderTool />} />
          <Route path="/developers/uuid-generator" element={<UuidGeneratorTool />} />
          <Route path="/developers/markdown-preview" element={<MarkdownPreviewTool />} />
          <Route path="/developers/seo-tools" element={<SeoTools />} />
          <Route path="/developers/robots-sitemap" element={<RobotsSitemapTool />} />

          {/* Informational Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
