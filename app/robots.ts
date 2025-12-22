import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://gobus.live'

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/customer',
                    '/customer/auth/login',
                    '/customer/auth/signup',
                    '/owner/auth/login',
                    '/owner/auth/signup',
                    '/driver/auth/login',
                ],
                disallow: [
                    '/api/',
                    '/owner/', // Protected owner dashboard
                    '/driver/', // Protected driver dashboard
                    '/customer/tickets', // Protected customer pages
                    '/customer/scan',
                    '/_next/',
                    '/private/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
