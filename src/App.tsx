import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Catalogues
import { NormalUserCatalogue } from './pages/NormalUserCatalogue';
import { DevelopersCatalogue } from './pages/DevelopersCatalogue';

// Informational Pages
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Normal User Tools
import { CalculatorTool } from './pages/normal/CalculatorTool';
import { ImageTools } from './pages/normal/ImageTools';
import { PdfTools } from './pages/normal/PdfTools';
import { QrGeneratorTool } from './pages/normal/QrGeneratorTool';
import { PasswordGeneratorTool } from './pages/normal/PasswordGeneratorTool';
import { WordCounterTool } from './pages/normal/WordCounterTool';
import { SpeedTestTool } from './pages/normal/SpeedTestTool';
import { IpCheckerTool } from './pages/normal/IpCheckerTool';
import { TimezoneTool } from './pages/normal/TimezoneTool';

// Developer Tools
import { JsonFormatterTool } from './pages/dev/JsonFormatterTool';
import { Base64Tool } from './pages/dev/Base64Tool';
import { UrlEncoderTool } from './pages/dev/UrlEncoderTool';
import { RegexTesterTool } from './pages/dev/RegexTesterTool';
import { HashCalculatorTool } from './pages/dev/HashCalculatorTool';
import { JwtDecoderTool } from './pages/dev/JwtDecoderTool';
import { UuidGeneratorTool } from './pages/dev/UuidGeneratorTool';
import { MarkdownPreviewTool } from './pages/dev/MarkdownPreviewTool';
import { SeoTools } from './pages/dev/SeoTools';
import { RobotsSitemapTool } from './pages/dev/RobotsSitemapTool';

export const App: React.FC = () => {
  return (
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
  );
};

export default App;
