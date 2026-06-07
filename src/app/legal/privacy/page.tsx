import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Expenses",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-900"
      >
        &larr; Back to app
      </Link>

      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: June 7, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">
            1. Introduction
          </h2>
          <p className="mt-2">
            This Privacy Policy describes how the Expenses application
            (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses,
            and protects your personal information. By using the Service, you
            consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            2. Information We Collect
          </h2>
          <p className="mt-2">We collect the following types of information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account Information:</strong> Name, email address, and
              password when you register
            </li>
            <li>
              <strong>Expense Data:</strong> Merchant names, amounts, dates,
              categories, and descriptions you enter or that are extracted from
              receipts
            </li>
            <li>
              <strong>Receipt Images:</strong> Photos or scans of receipts you
              upload for AI processing
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact
              with the Service, including login timestamps and feature usage
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating
              system, and device identifiers used to access the Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            3. How We Use Your Information
          </h2>
          <p className="mt-2">We use collected information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide and maintain the expense management Service</li>
            <li>
              Process receipts using AI to extract expense details (merchant,
              amount, date, category)
            </li>
            <li>
              Detect potential duplicate expenses across your reports
            </li>
            <li>
              Facilitate expense report submission, review, and approval
              workflows
            </li>
            <li>
              Sync approved expenses with connected accounting software (e.g.,
              QuickBooks Online) when authorized
            </li>
            <li>Communicate with you about your account and reports</li>
            <li>Improve the accuracy of our AI processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            4. AI Processing of Receipts
          </h2>
          <p className="mt-2">
            When you upload a receipt, we send the image to an AI service to
            extract relevant expense information. Receipt images may be
            temporarily processed by our AI provider but are not used to train AI
            models. Extracted data is stored in your account and associated with
            your expense report.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            5. Data Sharing
          </h2>
          <p className="mt-2">We may share your information with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Your Organization:</strong> Managers and administrators
              within your company can view your submitted expense reports as part
              of the approval workflow
            </li>
            <li>
              <strong>AI Service Providers:</strong> Receipt images are processed
              by third-party AI services to extract expense data
            </li>
            <li>
              <strong>Accounting Integrations:</strong> When you or your
              administrator connects QuickBooks Online, approved expense data is
              shared with Intuit
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information
              when required by law or to protect our rights
            </li>
          </ul>
          <p className="mt-2">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            6. Data Storage and Security
          </h2>
          <p className="mt-2">
            We implement appropriate technical and organizational measures to
            protect your data, including encryption in transit and at rest,
            role-based access controls, and secure session management. Receipt
            images and expense data are stored on secure servers with access
            limited to authorized personnel.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            7. Data Retention
          </h2>
          <p className="mt-2">
            We retain your data for as long as your account is active or as
            needed to provide the Service. Expense reports and receipts are
            retained in accordance with applicable financial record-keeping
            requirements. You may request deletion of your account and associated
            data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            8. Your Rights
          </h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            9. Cookies and Session Data
          </h2>
          <p className="mt-2">
            The Service uses session cookies to maintain your authenticated
            state. These cookies are essential for the Service to function and
            cannot be disabled. We do not use third-party tracking cookies or
            advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            10. Children&apos;s Privacy
          </h2>
          <p className="mt-2">
            The Service is not intended for individuals under the age of 18. We
            do not knowingly collect personal information from children. If you
            believe a child has provided us with personal data, please contact us
            and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            11. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will notify
            users of material changes via email or in-app notification. Your
            continued use of the Service after changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            12. Contact Us
          </h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy or wish to exercise
            your data rights, please contact us at privacy@expenses.app.
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        <Link href="/legal/terms" className="hover:text-slate-600">
          End User License Agreement
        </Link>
      </div>
    </div>
  );
}
